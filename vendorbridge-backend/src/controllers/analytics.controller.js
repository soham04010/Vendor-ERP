const { eq, sql, desc } = require('drizzle-orm');
const { db } = require('../config/db');
const { vendors, rfqs, purchase_orders, invoices, approvals } = require('../db/schema');

// @desc    Get dashboard summary metrics
// @route   GET /api/analytics/dashboard
// @access  Private (Admin, Officer, Manager)
exports.getDashboard = async (req, res) => {
  try {
    const [vendorsCount] = await db.select({ count: sql`count(*)` }).from(vendors);
    const [rfqsCount] = await db.select({ count: sql`count(*)` }).from(rfqs);
    const [poSummary] = await db.select({
      count: sql`count(*)`,
      sum: sql`coalesce(sum(${purchase_orders.total_amount}), 0)`
    }).from(purchase_orders);
    const [invoiceSummary] = await db.select({
      count: sql`count(*)`,
      sum: sql`coalesce(sum(${invoices.total_amount}), 0)`
    }).from(invoices);

    const rfqsByStatus = await db.select({
      status: rfqs.status,
      count: sql`count(*)`
    }).from(rfqs).groupBy(rfqs.status);

    res.json({
      metrics: {
        totalVendors: parseInt(vendorsCount?.count || 0),
        totalRfqs: parseInt(rfqsCount?.count || 0),
        totalPurchaseOrders: parseInt(poSummary?.count || 0),
        totalSpent: parseFloat(poSummary?.sum || 0),
        totalInvoices: parseInt(invoiceSummary?.count || 0),
        totalInvoicedAmount: parseFloat(invoiceSummary?.sum || 0)
      },
      rfqsByStatus
    });
  } catch (error) {
    console.error('Get dashboard analytics error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

// @desc    Get monthly spending statistics
// @route   GET /api/analytics/spending
// @access  Private (Admin, Officer, Manager)
exports.getSpending = async (req, res) => {
  try {
    const monthlySpending = await db.select({
      month: sql`to_char(${purchase_orders.created_at}, 'YYYY-MM')`,
      amount: sql`coalesce(sum(${purchase_orders.total_amount}), 0)`
    })
    .from(purchase_orders)
    .groupBy(sql`to_char(${purchase_orders.created_at}, 'YYYY-MM')`)
    .orderBy(sql`to_char(${purchase_orders.created_at}, 'YYYY-MM')`);

    res.json(monthlySpending);
  } catch (error) {
    console.error('Get spending analytics error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

// @desc    Get vendor performance and ratings
// @route   GET /api/analytics/vendors
// @access  Private (Admin, Officer, Manager)
exports.getVendors = async (req, res) => {
  try {
    const vendorPerformance = await db.select({
      vendor_id: vendors.id,
      vendor_name: vendors.name,
      rating: vendors.rating,
      po_count: sql`count(${purchase_orders.id})`,
      total_po_value: sql`coalesce(sum(${purchase_orders.total_amount}), 0)`
    })
    .from(vendors)
    .leftJoin(purchase_orders, eq(purchase_orders.vendor_id, vendors.id))
    .groupBy(vendors.id, vendors.name, vendors.rating)
    .orderBy(desc(sql`coalesce(sum(${purchase_orders.total_amount}), 0)`));

    res.json(vendorPerformance);
  } catch (error) {
    console.error('Get vendor analytics error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

// @desc    Get RFQs statistics
// @route   GET /api/analytics/rfqs
// @access  Private (Admin, Officer, Manager)
exports.getRfqs = async (req, res) => {
  try {
    const rfqsStats = await db.select({
      status: rfqs.status,
      count: sql`count(*)`
    })
    .from(rfqs)
    .groupBy(rfqs.status);

    res.json(rfqsStats);
  } catch (error) {
    console.error('Get RFQ analytics error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

// @desc    Get approvals statistics
// @route   GET /api/analytics/approvals
// @access  Private (Admin, Officer, Manager)
exports.getApprovals = async (req, res) => {
  try {
    const approvalStats = await db.select({
      status: approvals.status,
      count: sql`count(*)`
    })
    .from(approvals)
    .groupBy(approvals.status);

    res.json(approvalStats);
  } catch (error) {
    console.error('Get approvals analytics error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

// @desc    Export purchase orders to CSV
// @route   GET /api/analytics/export
// @access  Private (Admin, Officer, Manager)
exports.exportCsv = async (req, res) => {
  try {
    const pos = await db.select({
      po_number: purchase_orders.po_number,
      vendor_name: vendors.name,
      total_amount: purchase_orders.total_amount,
      status: purchase_orders.status,
      created_at: purchase_orders.created_at
    })
    .from(purchase_orders)
    .innerJoin(vendors, eq(vendors.id, purchase_orders.vendor_id))
    .orderBy(desc(purchase_orders.created_at));

    let csvContent = 'PO Number,Vendor Name,Total Amount (INR),Status,Date Issued\n';
    
    for (const po of pos) {
      const escapedVendorName = po.vendor_name ? po.vendor_name.replace(/"/g, '""') : '';
      csvContent += `"${po.po_number}","${escapedVendorName}",${parseFloat(po.total_amount).toFixed(2)},"${po.status}","${new Date(po.created_at).toISOString().split('T')[0]}"\n`;
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="purchase_orders_export.csv"');
    res.status(200).send(csvContent);
  } catch (error) {
    console.error('Export CSV error:', error);
    res.status(500).json({ error: 'Server error exporting data', details: error.message });
  }
};
