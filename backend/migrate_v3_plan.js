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
    console.log('Running Migration V3 - Adding plan columns...');
    
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'basic',
      ADD COLUMN IF NOT EXISTS plan_updated_at TIMESTAMP
    `);
    
    console.log('✅ Migration V3 completed successfully. Added plan and plan_updated_at columns.');
  } catch (err) {
    console.error('❌ Migration V3 failed:', err);
  } finally {
    await pool.end();
  }
}

migrate();
