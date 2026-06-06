const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('Tables in public schema:');
    res.rows.forEach(row => console.log('- ' + row.table_name));
  } catch (err) {
    console.error('Error running check:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
