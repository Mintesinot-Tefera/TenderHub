import fs from 'fs';
import path from 'path';
import { pool } from './pool';

async function migrate() {
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
  const client = await pool.connect();
  try {
    await client.query(sql);
    // Idempotent patches for existing databases
    await client.query(
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT'
    );
    await client.query(
      'ALTER TABLE bids ADD COLUMN IF NOT EXISTS document_url TEXT'
    );
    await client.query(
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE'
    );
    await client.query(
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255)'
    );
    await client.query(
      'ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL'
    );
    await client.query(
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE'
    );
    console.log('✓ Database schema applied successfully');
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
