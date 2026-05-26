import { pool } from '../pool.js';
import { isAllowedTable } from '../config/tables.js';

const IDENT_RE = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

export function assertIdent(name, label = 'identifier') {
  const s = String(name || '').trim();
  if (!IDENT_RE.test(s)) {
    const err = new Error(`Invalid ${label}: ${name}`);
    err.status = 400;
    throw err;
  }
  return s;
}

export async function getColumns(tableName) {
  assertIdent(tableName, 'table');
  const { rows } = await pool.query(
    `SELECT column_name, data_type, is_nullable
     FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = $1
     ORDER BY ordinal_position`,
    [tableName],
  );
  return rows;
}

export async function getTableCount(tableName) {
  assertIdent(tableName, 'table');
  if (!isAllowedTable(tableName)) {
    const err = new Error('Table not allowed');
    err.status = 403;
    throw err;
  }
  const { rows } = await pool.query(`SELECT COUNT(*)::bigint AS count FROM ${tableName}`);
  return Number(rows[0]?.count || 0);
}

export async function getLatestDate(tableName, dateColumn) {
  assertIdent(tableName, 'table');
  assertIdent(dateColumn, 'column');
  if (!isAllowedTable(tableName)) return null;
  const { rows } = await pool.query(
    `SELECT MAX(${dateColumn})::text AS latest FROM ${tableName}`,
  );
  return rows[0]?.latest || null;
}

/**
 * 通用分頁查詢（僅白名單表）
 */
export async function queryTable({
  table,
  page = 1,
  limit = 50,
  sort,
  order = 'desc',
  filters = {},
  search,
  searchColumns = [],
}) {
  assertIdent(table, 'table');
  if (!isAllowedTable(table)) {
    const err = new Error('Table not allowed');
    err.status = 403;
    throw err;
  }

  const columns = await getColumns(table);
  const colNames = columns.map((c) => c.column_name);
  if (!colNames.length) {
    const err = new Error('Table not found');
    err.status = 404;
    throw err;
  }

  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 500);
  const safePage = Math.max(Number(page) || 1, 1);
  const offset = (safePage - 1) * safeLimit;

  const sortCol = sort && colNames.includes(sort) ? sort : colNames[0];
  const sortDir = String(order).toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  const where = [];
  const params = [];
  let idx = 1;

  for (const [key, value] of Object.entries(filters)) {
    if (!colNames.includes(key) || value === '' || value == null) continue;
    where.push(`${key} = $${idx++}`);
    params.push(value);
  }

  if (search && searchColumns.length) {
    const parts = searchColumns
      .filter((c) => colNames.includes(c))
      .map((c) => `CAST(${c} AS TEXT) ILIKE $${idx}`);
    if (parts.length) {
      where.push(`(${parts.join(' OR ')})`);
      params.push(`%${search}%`);
      idx++;
    }
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const countSql = `SELECT COUNT(*)::bigint AS count FROM ${table} ${whereSql}`;
  const dataSql = `SELECT * FROM ${table} ${whereSql} ORDER BY ${sortCol} ${sortDir} NULLS LAST LIMIT $${idx++} OFFSET $${idx++}`;
  params.push(safeLimit, offset);

  const [countRes, dataRes] = await Promise.all([
    pool.query(countSql, params.slice(0, params.length - 2)),
    pool.query(dataSql, params),
  ]);

  return {
    rows: dataRes.rows,
    total: Number(countRes.rows[0]?.count || 0),
    page: safePage,
    limit: safeLimit,
    sort: sortCol,
    order: sortDir.toLowerCase(),
    columns: colNames,
  };
}
