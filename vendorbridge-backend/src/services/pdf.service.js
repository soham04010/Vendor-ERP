const PDFDocument = require('pdfkit');

/**
 * Streams the invoice PDF directly to an HTTP response (used by the download endpoint).
 */
exports.generateInvoicePDF = (invoice, po, vendor, res) => {
  const doc = new PDFDocument({ margin: 50 });

  // Stream the PDF to the response
  doc.pipe(res);

  // Header
  doc.fontSize(24).font('Helvetica-Bold').text('VendorBridge ERP', { align: 'left' });
  doc.fontSize(10).font('Helvetica').text('123 Corporate Office, Procurement Division', { align: 'left' });
  doc.text('New Delhi, India', { align: 'left' });
  doc.moveDown(2);

  // Invoice Title
  doc.fontSize(18).font('Helvetica-Bold').text(`INVOICE: ${invoice.invoice_number}`, { align: 'right' });
  doc.fontSize(10).font('Helvetica').text(`Date Generated: ${new Date(invoice.created_at).toLocaleDateString()}`, { align: 'right' });
  doc.text(`Due Date: ${new Date(invoice.due_date).toLocaleDateString()}`, { align: 'right' });
  doc.moveDown(2);

  // Vendor info
  doc.fontSize(12).font('Helvetica-Bold').text('Billed To:', { align: 'left' });
  doc.fontSize(10).font('Helvetica').text(vendor.name);
  if (vendor.gst_number) doc.text(`GSTIN: ${vendor.gst_number}`);
  doc.text(`Email: ${vendor.email}`);
  doc.text(`Phone: ${vendor.phone || 'N/A'}`);
  doc.text(`Address: ${vendor.address || 'N/A'}`);
  doc.moveDown(2);

  // PO Info
  doc.fontSize(12).font('Helvetica-Bold').text('Reference:', { align: 'left' });
  doc.fontSize(10).font('Helvetica').text(`Purchase Order Number: ${po.po_number}`);
  doc.moveDown(2);

  // Summary Table
  doc.fontSize(12).font('Helvetica-Bold').text('Financial Summary:', { align: 'left' });
  doc.moveDown(1);
  
  doc.fontSize(10).font('Helvetica');
  doc.text(`Subtotal: INR ${parseFloat(invoice.subtotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
  doc.text(`Tax Rate: ${invoice.tax_rate}%`);
  doc.text(`Tax Amount: INR ${parseFloat(invoice.tax_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
  doc.moveDown(1);
  doc.fontSize(14).font('Helvetica-Bold').text(`Total Amount: INR ${parseFloat(invoice.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
  
  doc.moveDown(3);
  doc.fontSize(10).font('Helvetica-Oblique').text('Thank you for your business!', { align: 'center' });

  doc.end();
};

/**
 * Generates the invoice PDF and resolves with a Buffer.
 * Used when attaching a real PDF to an outgoing email.
 */
exports.generateInvoicePDFBuffer = (invoice, po, vendor) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Header
    doc.fontSize(24).font('Helvetica-Bold').text('VendorBridge ERP', { align: 'left' });
    doc.fontSize(10).font('Helvetica').text('123 Corporate Office, Procurement Division', { align: 'left' });
    doc.text('New Delhi, India', { align: 'left' });
    doc.moveDown(2);

    // Invoice Title
    doc.fontSize(18).font('Helvetica-Bold').text(`INVOICE: ${invoice.invoice_number}`, { align: 'right' });
    doc.fontSize(10).font('Helvetica').text(`Date Generated: ${new Date(invoice.created_at).toLocaleDateString()}`, { align: 'right' });
    doc.text(`Due Date: ${new Date(invoice.due_date).toLocaleDateString()}`, { align: 'right' });
    doc.moveDown(2);

    // Vendor info
    doc.fontSize(12).font('Helvetica-Bold').text('Billed To:', { align: 'left' });
    doc.fontSize(10).font('Helvetica').text(vendor.name);
    if (vendor.gst_number) doc.text(`GSTIN: ${vendor.gst_number}`);
    doc.text(`Email: ${vendor.email}`);
    doc.text(`Phone: ${vendor.phone || 'N/A'}`);
    doc.text(`Address: ${vendor.address || 'N/A'}`);
    doc.moveDown(2);

    // PO Info
    doc.fontSize(12).font('Helvetica-Bold').text('Reference:', { align: 'left' });
    doc.fontSize(10).font('Helvetica').text(`Purchase Order Number: ${po.po_number}`);
    doc.moveDown(2);

    // Summary Table
    doc.fontSize(12).font('Helvetica-Bold').text('Financial Summary:', { align: 'left' });
    doc.moveDown(1);

    doc.fontSize(10).font('Helvetica');
    doc.text(`Subtotal: INR ${parseFloat(invoice.subtotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
    doc.text(`Tax Rate: ${invoice.tax_rate}%`);
    doc.text(`Tax Amount: INR ${parseFloat(invoice.tax_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
    doc.moveDown(1);
    doc.fontSize(14).font('Helvetica-Bold').text(`Total Amount: INR ${parseFloat(invoice.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);

    doc.moveDown(3);
    doc.fontSize(10).font('Helvetica-Oblique').text('Thank you for your business!', { align: 'center' });

    doc.end();
  });
};
