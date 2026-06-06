const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  const client = await pool.connect();
  try {
    console.log('Adding dob column to vendors table...');
    await client.query(`
      ALTER TABLE vendors 
      ADD COLUMN IF NOT EXISTS dob DATE;
    `);
    console.log('Added dob column successfully.');

    const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'vendors';
    `);
    console.log('Columns in vendors table:');
    res.rows.forEach(row => console.log(`- ${row.column_name}: ${row.data_type}`));
  } catch (err) {
    console.error('Error running check/alter:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
