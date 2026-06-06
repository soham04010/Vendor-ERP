const { eq, and, desc } = require('drizzle-orm');
const { db } = require('../config/db');
const { invoices, purchase_orders, vendors, users, quotation_items } = require('../db/schema');
const { createLog } = require('../services/log.service');
const { createNotification } = require('../services/notification.service');
const { generateInvoicePDF, generateInvoicePDFBuffer } = require('../services/pdf.service');
const { sendMail } = require('../services/email.service');
const generateInvoiceNumber = require('../utils/generateInvoiceNumber');
const calculateTax = require('../utils/calculateTax');

// @desc    Get all invoices
// @route   GET /api/invoices
// @access  Private
exports.getInvoices = async (req, res) => {
  try {
    let query = db.select({
      id: invoices.id,
      invoice_number: invoices.invoice_number,
      po_id: invoices.po_id,
      po_number: purchase_orders.po_number,
      vendor_id: invoices.vendor_id,
      vendor_name: vendors.name,
      subtotal: invoices.subtotal,
      tax_rate: invoices.tax_rate,
      tax_amount: invoices.tax_amount,
      total_amount: invoices.total_amount,
      status: invoices.status,
      due_date: invoices.due_date,
      paid_at: invoices.paid_at,
      created_at: invoices.created_at
    })
    .from(invoices)
    .innerJoin(vendors, eq(vendors.id, invoices.vendor_id))
    .innerJoin(purchase_orders, eq(purchase_orders.id, invoices.po_id));

    if (req.user.role === 'vendor') {
      if (!req.user.vendor_id) {
        return res.status(400).json({ error: 'User is not associated with any vendor' });
      }
      query.where(eq(invoices.vendor_id, req.user.vendor_id));
    }

    const invs = await query.orderBy(desc(invoices.created_at));
    res.json(invs);
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

// @desc    Create an invoice from a Purchase Order
// @route   POST /api/invoices
// @access  Private (Admin, Officer, Vendor)
exports.createInvoice = async (req, res) => {
  try {
    const { po_id, tax_rate, due_date } = req.body;

    if (!po_id) {
      return res.status(400).json({ error: 'Purchase Order ID (po_id) is required' });
    }

    // Retrieve PO
    const [po] = await db.select().from(purchase_orders).where(eq(purchase_orders.id, po_id));
    if (!po) {
      return res.status(404).json({ error: 'Purchase Order not found' });
    }

    // Check if invoice already exists for this PO
    const [existingInv] = await db.select().from(invoices).where(eq(invoices.po_id, po_id));
    if (existingInv) {
      return res.status(400).json({ error: `An invoice (${existingInv.invoice_number}) already exists for this Purchase Order` });
    }

    // RBAC: Vendor can only invoice their own POs
    if (req.user.role === 'vendor' && req.user.vendor_id !== po.vendor_id) {
      return res.status(403).json({ error: 'Access denied: cannot generate invoice for other vendors' });
    }

    const invoiceNumber = await generateInvoiceNumber();

    // Calculate tax using PO amount as subtotal
    const taxResults = calculateTax(po.total_amount, tax_rate !== undefined ? tax_rate : 18.00);

    const [newInvoice] = await db.insert(invoices).values({
      invoice_number: invoiceNumber,
      po_id,
      vendor_id: po.vendor_id,
      subtotal: taxResults.subtotal.toString(),
      tax_rate: taxResults.taxRate.toString(),
      tax_amount: taxResults.taxAmount.toString(),
      total_amount: taxResults.totalAmount.toString(),
      status: 'generated',
      due_date: due_date ? new Date(due_date).toISOString().split('T')[0] : null,
      created_by: req.user.id
    }).returning();

    // Notify appropriate users
    if (req.user.role === 'vendor') {
      // Notify internal officers
      const officers = await db.select().from(users).where(and(eq(users.role, 'officer'), eq(users.is_active, true)));
      for (const off of officers) {
        await createNotification({
          userId: off.id,
          title: 'Invoice Generated',
          message: `Vendor issued invoice ${invoiceNumber} for PO ${po.po_number}`,
          type: 'invoice_generated',
          entityId: newInvoice.id
        });
      }
    } else {
      // Notify vendor users
      const vendorUsers = await db.select().from(users).where(eq(users.vendor_id, po.vendor_id));
      for (const u of vendorUsers) {
        await createNotification({
          userId: u.id,
          title: 'Invoice Issued',
          message: `Invoice ${invoiceNumber} has been generated for Purchase Order ${po.po_number}`,
          type: 'invoice_generated',
          entityId: newInvoice.id
        });
      }
    }

    await createLog({
      userId: req.user.id,
      action: 'INVOICE_GENERATED',
      entityType: 'invoices',
      entityId: newInvoice.id,
      description: `Generated invoice ${invoiceNumber} for PO ${po.po_number}`
    });

    res.status(201).json(newInvoice);
  } catch (error) {
    console.error('Create invoice error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

// @desc    Get invoice by ID
// @route   GET /api/invoices/:id
// @access  Private
exports.getInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;

    const [invoice] = await db.select({
      id: invoices.id,
      invoice_number: invoices.invoice_number,
      po_id: invoices.po_id,
      po_number: purchase_orders.po_number,
      vendor_id: invoices.vendor_id,
      vendor_name: vendors.name,
      subtotal: invoices.subtotal,
      tax_rate: invoices.tax_rate,
      tax_amount: invoices.tax_amount,
      total_amount: invoices.total_amount,
      status: invoices.status,
      due_date: invoices.due_date,
      paid_at: invoices.paid_at,
      created_at: invoices.created_at
    })
    .from(invoices)
    .innerJoin(vendors, eq(vendors.id, invoices.vendor_id))
    .innerJoin(purchase_orders, eq(purchase_orders.id, invoices.po_id))
    .where(eq(invoices.id, id));

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    if (req.user.role === 'vendor' && req.user.vendor_id !== invoice.vendor_id) {
      return res.status(403).json({ error: 'Access denied: cannot view other vendor invoices' });
    }

    // Fetch items from quotation
    const [po] = await db.select().from(purchase_orders).where(eq(purchase_orders.id, invoice.po_id));
    const items = await db.select().from(quotation_items).where(eq(quotation_items.quotation_id, po.quotation_id));

    res.json({
      ...invoice,
      items
    });
  } catch (error) {
    console.error('Get invoice by ID error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

// @desc    Download PDF for invoice
// @route   GET /api/invoices/:id/pdf
// @access  Private
exports.downloadInvoicePDF = async (req, res) => {
  try {
    const { id } = req.params;

    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    if (req.user.role === 'vendor' && req.user.vendor_id !== invoice.vendor_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const [po] = await db.select().from(purchase_orders).where(eq(purchase_orders.id, invoice.po_id));
    const [vendor] = await db.select().from(vendors).where(eq(vendors.id, invoice.vendor_id));

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoice.invoice_number}.pdf"`);

    generateInvoicePDF(invoice, po, vendor, res);
  } catch (error) {
    console.error('Download invoice PDF error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Server error generating PDF', details: error.message });
    }
  }
};

// @desc    Send invoice via mock email
// @route   POST /api/invoices/:id/send
// @access  Private
exports.sendInvoiceEmail = async (req, res) => {
  try {
    const { id } = req.params;

    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    if (req.user.role === 'vendor' && req.user.vendor_id !== invoice.vendor_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const [po] = await db.select().from(purchase_orders).where(eq(purchase_orders.id, invoice.po_id));
    const [vendor] = await db.select().from(vendors).where(eq(vendors.id, invoice.vendor_id));

    const subject = `Invoice ${invoice.invoice_number} from VendorBridge`;
    const html = `
      <h3>Dear ${vendor.name},</h3>
      <p>Please find attached the financial invoice reference <b>${invoice.invoice_number}</b> related to Purchase Order <b>${po.po_number}</b>.</p>
      <br/>
      <table border="1" cellpadding="5" style="border-collapse: collapse;">
        <tr><td><b>Subtotal</b></td><td>INR ${parseFloat(invoice.subtotal).toFixed(2)}</td></tr>
        <tr><td><b>Tax rate</b></td><td>${invoice.tax_rate}%</td></tr>
        <tr><td><b>Tax Amount</b></td><td>INR ${parseFloat(invoice.tax_amount).toFixed(2)}</td></tr>
        <tr><td><b>Total Amount</b></td><td><b>INR ${parseFloat(invoice.total_amount).toFixed(2)}</b></td></tr>
      </table>
      <br/>
      <p>Thank you for your business!</p>
      <p>Best regards,<br/>VendorBridge ERP</p>
    `;

    // Generate a real PDF buffer to attach to the email
    const pdfBuffer = await generateInvoicePDFBuffer(invoice, po, vendor);

    // Send email with the real PDF attached
    await sendMail({
      to: vendor.email,
      subject,
      html,
      attachments: [
        {
          filename: `invoice-${invoice.invoice_number}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    });

    await createLog({
      userId: req.user.id,
      action: 'INVOICE_SENT_EMAIL',
      entityType: 'invoices',
      entityId: id,
      description: `Sent invoice ${invoice.invoice_number} email to ${vendor.email}`
    });

    res.json({ message: `Invoice email sent successfully to ${vendor.email}` });
  } catch (error) {
    console.error('Send invoice email error:', error);
    res.status(500).json({ error: 'Server error sending email', details: error.message });
  }
};

// @desc    Update invoice status
// @route   PATCH /api/invoices/:id/status
// @access  Private
exports.updateInvoiceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    if (req.user.role === 'vendor' && req.user.vendor_id !== invoice.vendor_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updates = {
      status,
      updated_at: new Date()
    };

    if (status === 'paid') {
      updates.paid_at = new Date();
    }

    const [updatedInvoice] = await db.update(invoices)
      .set(updates)
      .where(eq(invoices.id, id))
      .returning();

    // Notify appropriate users
    if (req.user.role === 'vendor') {
      // Notify internal officers
      const officers = await db.select().from(users).where(and(eq(users.role, 'officer'), eq(users.is_active, true)));
      for (const off of officers) {
        await createNotification({
          userId: off.id,
          title: 'Invoice Status Updated',
          message: `Vendor updated invoice ${invoice.invoice_number} status to ${status}`,
          type: 'invoice_status_change',
          entityId: id
        });
      }
    } else {
      // Notify vendor users
      const vendorUsers = await db.select().from(users).where(eq(users.vendor_id, invoice.vendor_id));
      for (const u of vendorUsers) {
        await createNotification({
          userId: u.id,
          title: 'Invoice Status Updated',
          message: `Invoice ${invoice.invoice_number} status has been updated to ${status}`,
          type: 'invoice_status_change',
          entityId: id
        });
      }
    }

    await createLog({
      userId: req.user.id,
      action: 'INVOICE_STATUS_UPDATED',
      entityType: 'invoices',
      entityId: id,
      description: `Updated status of invoice ${invoice.invoice_number} to ${status}`,
      metadata: { status }
    });

    res.json(updatedInvoice);
  } catch (error) {
    console.error('Update invoice status error:', error);
    res.status(500).json({ error: 'Server error updating status', details: error.message });
  }
};

// @desc    Get invoices for logged in vendor
// @route   GET /api/invoices/vendor/mine
// @access  Private (Vendor)
exports.getVendorMine = async (req, res) => {
  try {
    if (!req.user.vendor_id) {
      return res.status(400).json({ error: 'User is not associated with any vendor' });
    }

    const invs = await db.select({
      id: invoices.id,
      invoice_number: invoices.invoice_number,
      po_id: invoices.po_id,
      po_number: purchase_orders.po_number,
      vendor_id: invoices.vendor_id,
      vendor_name: vendors.name,
      subtotal: invoices.subtotal,
      tax_rate: invoices.tax_rate,
      tax_amount: invoices.tax_amount,
      total_amount: invoices.total_amount,
      status: invoices.status,
      due_date: invoices.due_date,
      paid_at: invoices.paid_at,
      created_at: invoices.created_at
    })
    .from(invoices)
    .innerJoin(vendors, eq(vendors.id, invoices.vendor_id))
    .innerJoin(purchase_orders, eq(purchase_orders.id, invoices.po_id))
    .where(eq(invoices.vendor_id, req.user.vendor_id))
    .orderBy(desc(invoices.created_at));

    res.json(invs);
  } catch (error) {
    console.error('Get vendor mine invoices error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};
