import { Router } from 'express';
import { pool } from '../pool.js';
import { normalizeSymbol, symbolVariants } from '../config/tables.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim();
    const limit = Math.min(Math.max(Number(req.query.limit) || 30, 1), 100);
    const market = String(req.query.market || '').trim();

    let sql = `
      SELECT symbol, name, short_name, market, industry
      FROM tw_stock_symbols
      WHERE 1=1
    `;
    const params = [];
    let idx = 1;

    if (q) {
      sql += ` AND (
        symbol ILIKE $${idx}
        OR name ILIKE $${idx}
        OR short_name ILIKE $${idx}
        OR REPLACE(symbol, '.TW', '') ILIKE $${idx}
        OR REPLACE(symbol, '.TWO', '') ILIKE $${idx}
      )`;
      params.push(`%${q}%`);
      idx++;
    }

    if (market) {
      sql += ` AND market ILIKE $${idx++}`;
      params.push(`%${market}%`);
    }

    sql += ` ORDER BY symbol LIMIT $${idx}`;
    params.push(limit);

    const { rows } = await pool.query(sql, params);
    res.json({ stocks: rows, total: rows.length });
  } catch (e) {
    next(e);
  }
});

router.get('/markets', async (_req, res, next) => {
  try {
    const { rows } = await pool.query(`
      SELECT market, COUNT(*)::int AS count
      FROM tw_stock_symbols
      WHERE market IS NOT NULL AND market <> ''
      GROUP BY market
      ORDER BY count DESC
    `);
    res.json({ markets: rows });
  } catch (e) {
    next(e);
  }
});

router.get('/industries', async (_req, res, next) => {
  try {
    const { rows } = await pool.query(`
      SELECT industry, COUNT(*)::int AS count
      FROM tw_stock_symbols
      WHERE industry IS NOT NULL AND industry <> ''
      GROUP BY industry
      ORDER BY count DESC
      LIMIT 100
    `);
    res.json({ industries: rows });
  } catch (e) {
    next(e);
  }
});

router.get('/:symbol', async (req, res, next) => {
  try {
    const variants = symbolVariants(req.params.symbol);
    if (!variants.length) {
      return res.status(400).json({ error: 'Invalid symbol' });
    }

    const { rows: symbols } = await pool.query(
      `SELECT * FROM tw_stock_symbols WHERE symbol = ANY($1::text[]) LIMIT 1`,
      [variants],
    );
    const stock = symbols[0];
    if (!stock) {
      return res.status(404).json({ error: 'Stock not found' });
    }

    const sym = stock.symbol;
    const code = normalizeSymbol(sym);

    const [
      latestPrice,
      latestValuation,
      latestInstitutional,
      latestMargin,
      latestRevenue,
      financialCount,
    ] = await Promise.all([
      pool.query(
        `SELECT date, close_price, volume, change_percent
         FROM tw_stock_prices WHERE symbol = $1 ORDER BY date DESC LIMIT 1`,
        [sym],
      ),
      pool.query(
        `SELECT date, pe_ratio, pb_ratio, dividend_yield
         FROM tw_stock_bwibbu WHERE code = $1 ORDER BY date DESC LIMIT 1`,
        [code],
      ),
      pool.query(
        `SELECT date, foreign_total_net, investment_trust_net, dealer_total_net, overall_net
         FROM tw_institutional_trades WHERE stock_no = $1 ORDER BY date DESC LIMIT 1`,
        [code],
      ),
      pool.query(
        `SELECT date, margin_balance, short_balance
         FROM margin_trades WHERE stock_no = $1 ORDER BY date DESC LIMIT 1`,
        [code],
      ),
      pool.query(
        `SELECT revenue_month, month_revenue, mom_change_pct, yoy_change_pct
         FROM tw_monthly_revenue WHERE stock_no = $1 ORDER BY revenue_month DESC LIMIT 1`,
        [code],
      ),
      pool.query(
        `SELECT
           (SELECT COUNT(*) FROM tw_balance_sheet WHERE "股票代號" = $1) AS balance_periods,
           (SELECT COUNT(*) FROM tw_income_statement WHERE "股票代號" = $1) AS income_periods,
           (SELECT COUNT(*) FROM tw_financial_ratios WHERE symbol = $2) AS ratio_periods`,
        [code, sym],
      ),
    ]);

    res.json({
      stock,
      latest: {
        price: latestPrice.rows[0] || null,
        valuation: latestValuation.rows[0] || null,
        institutional: latestInstitutional.rows[0] || null,
        margin: latestMargin.rows[0] || null,
        revenue: latestRevenue.rows[0] || null,
      },
      counts: financialCount.rows[0] || {},
    });
  } catch (e) {
    next(e);
  }
});

router.get('/:symbol/prices', async (req, res, next) => {
  try {
    const variants = symbolVariants(req.params.symbol);
    const { rows: syms } = await pool.query(
      `SELECT symbol FROM tw_stock_symbols WHERE symbol = ANY($1::text[]) LIMIT 1`,
      [variants],
    );
    if (!syms.length) return res.status(404).json({ error: 'Stock not found' });

    const limit = Math.min(Math.max(Number(req.query.limit) || 250, 1), 2000);
    const from = req.query.from || null;
    const to = req.query.to || null;

    let sql = `
      SELECT date, open_price, high_price, low_price, close_price, volume, change_percent
      FROM tw_stock_prices WHERE symbol = $1
    `;
    const params = [syms[0].symbol];
    let idx = 2;
    if (from) { sql += ` AND date >= $${idx++}`; params.push(from); }
    if (to) { sql += ` AND date <= $${idx++}`; params.push(to); }
    sql += ` ORDER BY date DESC LIMIT $${idx}`;
    params.push(limit);

    const { rows } = await pool.query(sql, params);
    res.json({ symbol: syms[0].symbol, prices: rows.reverse() });
  } catch (e) {
    next(e);
  }
});

router.get('/:symbol/valuation', async (req, res, next) => {
  try {
    const code = normalizeSymbol(req.params.symbol);
    const limit = Math.min(Math.max(Number(req.query.limit) || 250, 1), 2000);
    const { rows } = await pool.query(
      `SELECT date, pe_ratio, pb_ratio, dividend_yield, name
       FROM tw_stock_bwibbu WHERE code = $1 ORDER BY date DESC LIMIT $2`,
      [code, limit],
    );
    res.json({ symbol: code, valuation: rows.reverse() });
  } catch (e) {
    next(e);
  }
});

router.get('/:symbol/returns', async (req, res, next) => {
  try {
    const variants = symbolVariants(req.params.symbol);
    const { rows: syms } = await pool.query(
      `SELECT symbol FROM tw_stock_symbols WHERE symbol = ANY($1::text[]) LIMIT 1`,
      [variants],
    );
    if (!syms.length) return res.status(404).json({ error: 'Stock not found' });

    const limit = Math.min(Math.max(Number(req.query.limit) || 250, 1), 2000);
    const { rows } = await pool.query(
      `SELECT date, daily_return, weekly_return, monthly_return, quarterly_return, yearly_return
       FROM tw_stock_returns WHERE symbol = $1 ORDER BY date DESC LIMIT $2`,
      [syms[0].symbol, limit],
    );
    res.json({ symbol: syms[0].symbol, returns: rows.reverse() });
  } catch (e) {
    next(e);
  }
});

router.get('/:symbol/revenue', async (req, res, next) => {
  try {
    const code = normalizeSymbol(req.params.symbol);
    const limit = Math.min(Math.max(Number(req.query.limit) || 60, 1), 240);
    const { rows } = await pool.query(
      `SELECT revenue_month, month_revenue, mom_change_pct, yoy_change_pct,
              acc_revenue, acc_change_pct, industry, stock_name
       FROM tw_monthly_revenue WHERE stock_no = $1 ORDER BY revenue_month DESC LIMIT $2`,
      [code, limit],
    );
    res.json({ symbol: code, revenue: rows.reverse() });
  } catch (e) {
    next(e);
  }
});

router.get('/:symbol/institutional', async (req, res, next) => {
  try {
    const code = normalizeSymbol(req.params.symbol);
    const limit = Math.min(Math.max(Number(req.query.limit) || 120, 1), 500);
    const { rows } = await pool.query(
      `SELECT date, foreign_total_net, investment_trust_net, dealer_total_net, overall_net,
              foreign_buy, foreign_sell, investment_trust_buy, investment_trust_sell
       FROM tw_institutional_trades WHERE stock_no = $1 ORDER BY date DESC LIMIT $2`,
      [code, limit],
    );
    res.json({ symbol: code, trades: rows.reverse() });
  } catch (e) {
    next(e);
  }
});

router.get('/:symbol/margin', async (req, res, next) => {
  try {
    const code = normalizeSymbol(req.params.symbol);
    const limit = Math.min(Math.max(Number(req.query.limit) || 120, 1), 500);
    const { rows } = await pool.query(
      `SELECT date, margin_balance, margin_buy, margin_sell, margin_repay,
              short_balance, short_sell, short_buy, short_repay
       FROM margin_trades WHERE stock_no = $1 ORDER BY date DESC LIMIT $2`,
      [code, limit],
    );
    res.json({ symbol: code, margin: rows.reverse() });
  } catch (e) {
    next(e);
  }
});

router.get('/:symbol/financials/balance', async (req, res, next) => {
  try {
    const code = normalizeSymbol(req.params.symbol);
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 80);
    const { rows } = await pool.query(
      `SELECT * FROM tw_balance_sheet WHERE "股票代號" = $1 ORDER BY period DESC LIMIT $2`,
      [code, limit],
    );
    res.json({ symbol: code, balanceSheets: rows });
  } catch (e) {
    next(e);
  }
});

router.get('/:symbol/financials/income', async (req, res, next) => {
  try {
    const code = normalizeSymbol(req.params.symbol);
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 80);
    const { rows } = await pool.query(
      `SELECT * FROM tw_income_statement WHERE "股票代號" = $1 ORDER BY period DESC LIMIT $2`,
      [code, limit],
    );
    res.json({ symbol: code, incomeStatements: rows });
  } catch (e) {
    next(e);
  }
});

router.get('/:symbol/financials/ratios', async (req, res, next) => {
  try {
    const variants = symbolVariants(req.params.symbol);
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 80);
    const { rows } = await pool.query(
      `SELECT * FROM tw_financial_ratios WHERE symbol = ANY($1::text[]) ORDER BY period DESC LIMIT $2`,
      [variants, limit],
    );
    res.json({ symbol: normalizeSymbol(req.params.symbol), ratios: rows });
  } catch (e) {
    next(e);
  }
});

export default router;
