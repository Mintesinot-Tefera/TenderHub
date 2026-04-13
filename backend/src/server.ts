import app from './app';
import { env } from './config/env';
import { pool } from './infrastructure/database/pool';

const start = async () => {
  try {
    await pool.query('SELECT 1');
    console.log('✓ Database connected');

    app.listen(env.port, () => {
      console.log(`✓ Server running on http://localhost:${env.port}`);
      console.log(`  Environment: ${env.nodeEnv}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

start();
