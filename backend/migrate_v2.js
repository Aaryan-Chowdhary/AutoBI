import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function migrate() {
  try {
    console.log('Running Migration V2...');
    
    // Add missing columns if they don't exist
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS bio TEXT,
      ADD COLUMN IF NOT EXISTS notif_email BOOLEAN DEFAULT TRUE,
      ADD COLUMN IF NOT EXISTS notif_data_alerts BOOLEAN DEFAULT TRUE,
      ADD COLUMN IF NOT EXISTS notif_report_schedule BOOLEAN DEFAULT TRUE,
      ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'light',
      ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'English'
    `);
    
    console.log('Migration V2 completed successfully.');
  } catch (err) {
    console.error('Migration V2 failed:', err);
  } finally {
    await pool.end();
  }
}

migrate();
