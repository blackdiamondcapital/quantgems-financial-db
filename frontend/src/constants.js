export const CATEGORY_META = {
  market: { label: '行情資料', badge: 'badge-market', color: '#a78bfa', icon: 'chart' },
  valuation: { label: '估值指標', badge: 'badge-valuation', color: '#4d9fff', icon: 'gauge' },
  financial: { label: '財務報表', badge: 'badge-financial', color: '#c9a84c', icon: 'report' },
  revenue: { label: '營收資料', badge: 'badge-revenue', color: '#fbbf24', icon: 'revenue' },
  flow: { label: '資金流向', badge: 'badge-flow', color: '#34d399', icon: 'flow' },
};

/** 資料表英文名 → 中文名稱 */
export const TABLE_LABELS = {
  tw_stock_symbols: '股票基本資料',
  tw_stock_prices: '日線股價',
  tw_stock_returns: '報酬率',
  tw_stock_bwibbu: '本益比／殖利率／股價淨值',
  tw_balance_sheet: '資產負債表',
  tw_income_statement: '綜合損益表',
  tw_financial_ratios: '財務比率',
  tw_income_ratios: '損益比率分析',
  tw_monthly_revenue: '月營收',
  stock_monthly_revenue: '月營收備份',
  mops_monthly_revenue: '公開資訊觀測站月營收',
  tw_institutional_trades: '三大法人買賣超',
  margin_trades: '融資融券',
  tw_margin_trades: '融資融券（台股）',
  stock_symbols: '股票主檔',
  stock_prices: '日線股價主檔',
  stock_returns: '報酬率主檔',
};

export function tableLabel(name) {
  return TABLE_LABELS[name] || name;
}

export const NAV_ITEMS = [
  { to: '/', label: '控制台', icon: 'dashboard' },
  { to: '/stocks', label: '股票資料', icon: 'stocks' },
  { to: '/explore', label: '資料表瀏覽', icon: 'table' },
];

export const CHART_THEME = {
  bg: 'transparent',
  text: '#6b7d99',
  grid: '#1e2d42',
  colors: ['#4d9fff', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#c9a84c'],
};

export function fmtBig(n) {
  const v = Number(n) || 0;
  if (v >= 1e9) return `${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(1)}K`;
  return v.toLocaleString('zh-TW');
}

export function categoryBadgeClass(cat) {
  return CATEGORY_META[cat]?.badge || 'badge';
}
