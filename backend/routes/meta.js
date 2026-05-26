import { Router } from 'express';
import { pool } from '../pool.js';
import {
  TABLE_CATALOG,
  CATEGORY_LABELS,
  isAllowedTable,
} from '../config/tables.js';
import { getColumns, getTableCount, getLatestDate } from '../lib/query.js';

const router = Router();

router.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({
      ok: true,
      db: 'connected',
      service: 'QuantGems Financial Database',
      version: '1.0.0',
      mode: 'read-only',
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    res.status(503).json({ ok: false, db: 'disconnected', error: e.message });
  }
});

router.get('/overview', async (_req, res, next) => {
  try {
    const tables = Object.entries(TABLE_CATALOG);
    const stats = await Promise.all(
      tables.map(async ([name, meta]) => {
        let count = 0;
        let latest = null;
        try {
          count = await getTableCount(name);
          const dateCol = meta.dateColumn || meta.periodColumn;
          if (dateCol) latest = await getLatestDate(name, dateCol);
        } catch {
          /* table may not exist */
        }
        return {
          name,
          label: meta.label,
          category: meta.category,
          categoryLabel: CATEGORY_LABELS[meta.category] || meta.category,
          description: meta.description,
          count,
          latest,
        };
      }),
    );

    const totalRows = stats.reduce((s, t) => s + t.count, 0);
    const activeTables = stats.filter((t) => t.count > 0).length;

    let coverage = {};
    try {
      const [stockRes, priceRes, instRes] = await Promise.all([
        pool.query('SELECT COUNT(*)::int AS c FROM tw_stock_symbols'),
        pool.query('SELECT MAX(date)::text AS d FROM tw_stock_prices'),
        pool.query('SELECT MAX(date)::text AS d FROM tw_institutional_trades'),
      ]);
      coverage = {
        stockCount: stockRes.rows[0]?.c || 0,
        latestPriceDate: priceRes.rows[0]?.d || null,
        latestInstitutionalDate: instRes.rows[0]?.d || null,
      };
    } catch { /* optional */ }

    res.json({
      summary: {
        totalTables: stats.length,
        activeTables,
        totalRows,
        categories: Object.keys(CATEGORY_LABELS).map((k) => ({
          key: k,
          label: CATEGORY_LABELS[k],
          tables: stats.filter((t) => t.category === k && t.count > 0).length,
        })),
      },
      coverage,
      tables: stats.sort((a, b) => b.count - a.count),
    });
  } catch (e) {
    next(e);
  }
});

router.get('/tables', (_req, res) => {
  const tables = Object.entries(TABLE_CATALOG).map(([name, meta]) => ({
    name,
    ...meta,
    categoryLabel: CATEGORY_LABELS[meta.category] || meta.category,
  }));
  res.json({ tables });
});

router.get('/tables/:name/columns', async (req, res, next) => {
  try {
    const { name } = req.params;
    if (!isAllowedTable(name)) {
      return res.status(403).json({ error: 'Table not allowed' });
    }
    const columns = await getColumns(name);
    res.json({ table: name, columns, meta: TABLE_CATALOG[name] });
  } catch (e) {
    next(e);
  }
});

router.get('/categories', (_req, res) => {
  res.json({ categories: CATEGORY_LABELS });
});

export default router;
