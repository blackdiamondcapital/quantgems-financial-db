import { Router } from 'express';
import { TABLE_CATALOG, isAllowedTable } from '../config/tables.js';
import { queryTable, getColumns } from '../lib/query.js';

const router = Router();

router.get('/:table', async (req, res, next) => {
  try {
    const { table } = req.params;
    if (!isAllowedTable(table)) {
      return res.status(403).json({ error: 'Table not allowed' });
    }

    const meta = TABLE_CATALOG[table];
    const filters = {};
    for (const [k, v] of Object.entries(req.query)) {
      if (['page', 'limit', 'sort', 'order', 'q'].includes(k)) continue;
      if (v !== undefined && v !== '') filters[k] = v;
    }

    const searchColumns = [
      meta.symbolColumn,
      meta.nameColumn,
      'stock_name',
      'name',
      'symbol',
      'code',
      '股票代號',
      'company_name',
    ].filter(Boolean);

    const result = await queryTable({
      table,
      page: req.query.page,
      limit: req.query.limit,
      sort: req.query.sort,
      order: req.query.order,
      filters,
      search: req.query.q,
      searchColumns,
    });

    res.json({
      table,
      meta,
      ...result,
    });
  } catch (e) {
    next(e);
  }
});

router.get('/:table/columns', async (req, res, next) => {
  try {
    const { table } = req.params;
    if (!isAllowedTable(table)) {
      return res.status(403).json({ error: 'Table not allowed' });
    }
    const columns = await getColumns(table);
    res.json({ table, columns, meta: TABLE_CATALOG[table] });
  } catch (e) {
    next(e);
  }
});

export default router;
