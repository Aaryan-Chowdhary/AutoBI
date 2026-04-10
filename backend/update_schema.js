import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function updateSchema() {
  try {
    console.log('Checking schema...');
    
    // Check if photo_url exists
    const checkRes = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='users' AND column_name='photo_url'
    `);
    
    if (checkRes.rows.length === 0) {
      console.log('Adding photo_url column to users table...');
      await pool.query('ALTER TABLE users ADD COLUMN photo_url TEXT');
      console.log('Successfully added photo_url column.');
    } else {
      console.log('photo_url column already exists.');
    }
  } catch (err) {
    console.error('Error updating schema:', err);
  } finally {
    await pool.end();
  }
}

updateSchema();
