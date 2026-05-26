const rawBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').trim();
const normalizedBaseUrl = rawBaseUrl.replace(/\\/$/, '');
const BASE = normalizedBaseUrl ? `${normalizedBaseUrl}/api` : '/api';

async function request(path, params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') qs.set(k, v);
  });
  const query = qs.toString();
  const url = `${BASE}${path}${query ? `?${query}` : ''}`;
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  health: () => request('/meta/health'),
  overview: () => request('/meta/overview'),
  tables: () => request('/meta/tables'),
  tableColumns: (name) => request(`/meta/tables/${name}/columns`),
  explore: (table, params = {}) => request(`/explore/${table}`, params),
  searchStocks: (params = {}) => request('/stocks', params),
  stockMarkets: () => request('/stocks/markets'),
  stockDetail: (symbol) => request(`/stocks/${encodeURIComponent(symbol)}`),
  stockPrices: (symbol, params) => request(`/stocks/${encodeURIComponent(symbol)}/prices`, params),
  stockValuation: (symbol, params) => request(`/stocks/${encodeURIComponent(symbol)}/valuation`, params),
  stockReturns: (symbol, params) => request(`/stocks/${encodeURIComponent(symbol)}/returns`, params),
  stockRevenue: (symbol, params) => request(`/stocks/${encodeURIComponent(symbol)}/revenue`, params),
  stockInstitutional: (symbol, params) => request(`/stocks/${encodeURIComponent(symbol)}/institutional`, params),
  stockMargin: (symbol, params) => request(`/stocks/${encodeURIComponent(symbol)}/margin`, params),
  stockBalance: (symbol) => request(`/stocks/${encodeURIComponent(symbol)}/financials/balance`),
  stockIncome: (symbol) => request(`/stocks/${encodeURIComponent(symbol)}/financials/income`),
  stockRatios: (symbol) => request(`/stocks/${encodeURIComponent(symbol)}/financials/ratios`),
};

export function fmtNum(v, digits = 2) {
  if (v == null || v === '') return '—';
  const n = Number(v);
  if (!Number.isFinite(n)) return String(v);
  if (Math.abs(n) >= 1e8) return `${(n / 1e8).toFixed(digits)} 億`;
  if (Math.abs(n) >= 1e4) return n.toLocaleString('zh-TW', { maximumFractionDigits: digits });
  return n.toLocaleString('zh-TW', { maximumFractionDigits: digits });
}

export function fmtPct(v) {
  if (v == null || v === '') return '—';
  const n = Number(v);
  if (!Number.isFinite(n)) return String(v);
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toFixed(2)}%`;
}

export function fmtDate(v) {
  if (!v) return '—';
  return String(v).slice(0, 10);
}
