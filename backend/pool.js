import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import pkg from 'pg';

const { Pool } = pkg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const databaseUrl = String(process.env.DATABASE_URL || '').trim();
const isNeon = /\.neon\.tech\b/i.test(databaseUrl);

const config = databaseUrl
  ? { connectionString: databaseUrl }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 5432,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD ?? '',
      database: process.env.DB_NAME || 'quantgem',
    };

if (isNeon || process.env.DB_SSL_REQUIRE === 'true') {
  config.ssl = { rejectUnauthorized: false };
}

config.max = Math.min(Math.max(Number(process.env.DB_POOL_MAX) || 10, 1), 20);
config.idleTimeoutMillis = 30000;
config.connectionTimeoutMillis = 10000;

export const pool = new Pool(config);

pool.on('error', (err) => {
  console.error('[db] pool error:', err.message);
});
