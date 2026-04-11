import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function setupSchema() {
  try {
    console.log('🚀 Setting up Neon DB schema...');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        firebase_uid TEXT UNIQUE,
        name TEXT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT,
        photo_url TEXT,
        bio TEXT,
        role TEXT DEFAULT 'user',
        notif_email BOOLEAN DEFAULT TRUE,
        notif_data_alerts BOOLEAN DEFAULT TRUE,
        notif_report_schedule BOOLEAN DEFAULT TRUE,
        theme TEXT DEFAULT 'light',
        language TEXT DEFAULT 'English',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('✅ users table ready.');

    console.log('🎉 All tables created successfully in Neon DB!');
  } catch (err) {
    console.error('❌ Schema setup failed:', err);
  } finally {
    await pool.end();
  }
}

setupSchema();
