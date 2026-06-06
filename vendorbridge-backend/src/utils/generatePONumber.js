const { db } = require('../config/db');
const { purchase_orders } = require('../db/schema');
const { sql } = require('drizzle-orm');

async function generatePONumber() {
  const currentYear = new Date().getFullYear();
  
  const [result] = await db.select({
    count: sql`count(*)`
  }).from(purchase_orders);
  
  const count = parseInt(result?.count || 0) + 1;
  const seq = String(count).padStart(4, '0');
  
  return `PO-${currentYear}-${seq}`;
}

module.exports = generatePONumber;
