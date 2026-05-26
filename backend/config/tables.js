/** 可對外查詢的金融資料表白名單 */
export const TABLE_CATALOG = {
  tw_stock_symbols: {
    label: '股票基本資料',
    category: 'market',
    description: '台股代號、名稱、市場、產業',
    symbolColumn: 'symbol',
    nameColumn: 'name',
  },
  tw_stock_prices: {
    label: '日線股價',
    category: 'market',
    description: '開高低收、成交量、漲跌幅',
    symbolColumn: 'symbol',
    dateColumn: 'date',
  },
  tw_stock_returns: {
    label: '報酬率',
    category: 'market',
    description: '日/週/月/季/年報酬率',
    symbolColumn: 'symbol',
    dateColumn: 'date',
  },
  tw_stock_bwibbu: {
    label: '本益比 / 殖利率 / 股價淨值',
    category: 'valuation',
    description: '每日 PE、PB、殖利率',
    symbolColumn: 'code',
    dateColumn: 'date',
  },
  tw_balance_sheet: {
    label: '資產負債表',
    category: 'financial',
    description: 'IFRS 資產負債表（完整欄位）',
    symbolColumn: '股票代號',
    periodColumn: 'period',
  },
  tw_income_statement: {
    label: '綜合損益表',
    category: 'financial',
    description: 'IFRS 損益表（完整欄位）',
    symbolColumn: '股票代號',
    periodColumn: 'period',
  },
  tw_financial_ratios: {
    label: '財務比率',
    category: 'financial',
    description: 'ROE、ROA、流動比率、負債比率等',
    symbolColumn: 'symbol',
    periodColumn: 'period',
  },
  tw_income_ratios: {
    label: '損益比率分析',
    category: 'financial',
    description: '毛利率、營益率、費用率、EPS 等',
    symbolColumn: '股票代號',
    periodColumn: 'period',
  },
  tw_monthly_revenue: {
    label: '月營收',
    category: 'revenue',
    description: '公開資訊觀測站月營收',
    symbolColumn: 'stock_no',
    dateColumn: 'revenue_month',
  },
  stock_monthly_revenue: {
    label: '月營收備份',
    category: 'revenue',
    description: '月營收資料備份',
    symbolColumn: 'stock_no',
    dateColumn: 'revenue_month',
  },
  mops_monthly_revenue: {
    label: '公開資訊觀測站月營收',
    category: 'revenue',
    description: 'MOPS 格式月營收',
    symbolColumn: 'company_code',
    dateColumn: 'report_date',
  },
  tw_institutional_trades: {
    label: '三大法人買賣超',
    category: 'flow',
    description: '外資、投信、自營商每日買賣超',
    symbolColumn: 'stock_no',
    dateColumn: 'date',
  },
  margin_trades: {
    label: '融資融券',
    category: 'flow',
    description: '融資融券餘額與變化',
    symbolColumn: 'stock_no',
    dateColumn: 'date',
  },
  tw_margin_trades: {
    label: '融資融券（台股）',
    category: 'flow',
    description: '融資融券資料',
    symbolColumn: 'stock_no',
    dateColumn: 'date',
  },
  stock_symbols: {
    label: '股票主檔',
    category: 'market',
    description: '股票代號主檔',
    symbolColumn: 'symbol',
    nameColumn: 'name',
  },
  stock_prices: {
    label: '日線股價主檔',
    category: 'market',
    description: '日線股價主檔',
    symbolColumn: 'symbol',
    dateColumn: 'date',
  },
  stock_returns: {
    label: '報酬率主檔',
    category: 'market',
    description: '報酬率主檔',
    symbolColumn: 'symbol',
    dateColumn: 'date',
  },
};

export const CATEGORY_LABELS = {
  market: '行情資料',
  valuation: '估值指標',
  financial: '財務報表',
  revenue: '營收資料',
  flow: '資金流向',
};

export function isAllowedTable(name) {
  return Object.prototype.hasOwnProperty.call(TABLE_CATALOG, name);
}

export function normalizeSymbol(raw) {
  return String(raw || '').trim().replace(/\.TW$|\.TWO$/i, '');
}

export function symbolVariants(raw) {
  const base = normalizeSymbol(raw);
  if (!base) return [];
  const variants = new Set([base, `${base}.TW`, `${base}.TWO`]);
  return [...variants];
}
