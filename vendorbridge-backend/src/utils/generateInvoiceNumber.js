const { db } = require('../config/db');
const { invoices } = require('../db/schema');
const { sql } = require('drizzle-orm');

async function generateInvoiceNumber() {
  const currentYear = new Date().getFullYear();
  
  const [result] = await db.select({
    count: sql`count(*)`
  }).from(invoices);
  
  const count = parseInt(result?.count || 0) + 1;
  const seq = String(count).padStart(4, '0');
  
  return `INV-${currentYear}-${seq}`;
}

module.exports = generateInvoiceNumber;
