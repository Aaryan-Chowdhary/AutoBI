import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Required for Neon DB / hosted PostgreSQL
  },
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  // process.exit(-1); // DO NOT EXIT. Neon drops idle connections automatically. The pool will gracefully create a new one.
});

export const query = (text, params) => pool.query(text, params);

