import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import metaRoutes from './routes/meta.js';
import exploreRoutes from './routes/explore.js';
import stockRoutes from './routes/stocks.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = Number(process.env.PORT) || 3010;
const allowedOrigins = String(process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error('Not allowed by CORS'));
  },
}));
app.use(express.json({ limit: '1mb' }));

app.get('/api', (_req, res) => {
  res.json({
    name: 'QuantGems Financial Database API',
    version: '1.0.0',
    description: '台股金融資料庫 — 機構級唯讀查詢 API',
    mode: 'read-only',
    docs: '/api/meta/overview',
    endpoints: [
      'GET /api/meta/health',
      'GET /api/meta/overview',
      'GET /api/meta/tables',
      'GET /api/explore/:table',
      'GET /api/stocks',
      'GET /api/stocks/:symbol',
      'GET /api/stocks/:symbol/prices',
      'GET /api/stocks/:symbol/financials/balance',
    ],
  });
});

app.use('/api/meta', metaRoutes);
app.use('/api/explore', exploreRoutes);
app.use('/api/stocks', stockRoutes);

app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Internal server error',
    code: err.code || undefined,
  });
});

export default app;

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`[financial-db] API running at http://localhost:${PORT}`);
  });
}
