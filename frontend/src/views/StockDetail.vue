<template>
  <div class="page">
    <div v-if="loading" class="loading"><div class="spinner"></div>載入個股資料…</div>
    <div v-else-if="error" class="error-box">{{ error }}</div>
    <template v-else-if="detail">
      <!-- Ticker Header -->
      <div class="ticker-header card">
        <div class="ticker-left">
          <div class="ticker-symbol">{{ cleanSymbol(detail.stock.symbol) }}</div>
          <div class="ticker-name">{{ detail.stock.name }}</div>
          <div class="ticker-meta">
            <span class="badge badge-market">{{ detail.stock.market }}</span>
            <span v-if="detail.stock.industry" class="ticker-industry">{{ detail.stock.industry }}</span>
          </div>
        </div>
        <div v-if="detail.latest.price" class="ticker-price">
          <div class="price-main">{{ fmtNum(detail.latest.price.close_price) }}</div>
          <div class="price-change" :class="changeClass">
            {{ fmtPct(detail.latest.price.change_percent) }}
          </div>
          <div class="price-date">收盤 · {{ fmtDate(detail.latest.price.date) }}</div>
        </div>
      </div>

      <!-- KPI Row -->
      <div class="grid-stats">
        <KpiCard label="本益比 PE" :value="fmt(detail.latest.valuation?.pe_ratio)" sub="Trailing PE" />
        <KpiCard label="股價淨值比 PB" :value="fmt(detail.latest.valuation?.pb_ratio)" sub="Price / Book" />
        <KpiCard
          label="殖利率"
          :value="detail.latest.valuation?.dividend_yield != null ? fmtPct(detail.latest.valuation.dividend_yield) : '—'"
          sub="Dividend Yield"
        />
        <KpiCard
          label="法人買賣超"
          :value="fmtBig(detail.latest.institutional?.overall_net)"
          :sub="fmtDate(detail.latest.institutional?.date)"
          :value-class="netClass(detail.latest.institutional?.overall_net)"
        />
        <KpiCard label="融資餘額" :value="fmtBig(detail.latest.margin?.margin_balance)" sub="Margin Balance" />
        <KpiCard
          label="月營收 YoY"
          :value="fmtPct(detail.latest.revenue?.yoy_change_pct)"
          :sub="fmtDate(detail.latest.revenue?.revenue_month)"
          :value-class="netClass(detail.latest.revenue?.yoy_change_pct)"
        />
      </div>

      <!-- Data Coverage -->
      <div class="coverage-bar card">
        <span>資料涵蓋：</span>
        <span>資產負債表 {{ detail.counts.balance_periods || 0 }} 期</span>
        <span class="dot">·</span>
        <span>損益表 {{ detail.counts.income_periods || 0 }} 期</span>
        <span class="dot">·</span>
        <span>財務比率 {{ detail.counts.ratio_periods || 0 }} 期</span>
      </div>

      <!-- Tabs -->
      <div class="tabs">
        <button v-for="t in tabs" :key="t.key" class="tab" :class="{ active: tab === t.key }" @click="switchTab(t.key)">
          {{ t.label }}
        </button>
      </div>

      <div class="card panel">
        <div v-if="tabLoading" class="loading"><div class="spinner"></div>載入中…</div>
        <template v-else>
          <ChartPanel v-if="chartOption" :option="chartOption" />
          <DataTable v-if="tableRows.length" :columns="tableCols" :rows="tableRows" />
          <div v-if="!chartOption && !tableRows.length" class="empty-state">
            <div class="empty-icon">📭</div>
            <p>此分類暫無資料</p>
          </div>
        </template>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { api, fmtNum, fmtPct, fmtDate } from '../services/api.js';
import { CHART_THEME } from '../constants.js';
import KpiCard from '../components/KpiCard.vue';
import ChartPanel from '../components/ChartPanel.vue';
import DataTable from '../components/DataTable.vue';

const route = useRoute();
const symbol = computed(() => route.params.symbol);
const detail = ref(null);
const loading = ref(true);
const tabLoading = ref(false);
const error = ref('');
const tab = ref('prices');
const tabData = ref(null);

const tabs = [
  { key: 'prices', label: '股價走勢' },
  { key: 'valuation', label: '估值 PE/PB' },
  { key: 'returns', label: '報酬率' },
  { key: 'revenue', label: '月營收' },
  { key: 'institutional', label: '三大法人' },
  { key: 'margin', label: '融資融券' },
  { key: 'balance', label: '資產負債表' },
  { key: 'income', label: '損益表' },
  { key: 'ratios', label: '財務比率' },
];

const changeClass = computed(() => {
  const p = detail.value?.latest?.price?.change_percent;
  if (p == null) return '';
  return Number(p) >= 0 ? 'positive' : 'negative';
});

function cleanSymbol(sym) {
  return String(sym).replace(/\.TW$|\.TWO$/i, '');
}

function netClass(v) {
  if (v == null) return '';
  return Number(v) >= 0 ? 'positive' : 'negative';
}

const chartOption = computed(() => {
  const d = tabData.value;
  if (!d) return null;
  const { text, grid, colors } = CHART_THEME;
  const baseAxis = {
    axisLabel: { color: text, fontSize: 11 },
    axisLine: { lineStyle: { color: grid } },
    splitLine: { lineStyle: { color: grid, type: 'dashed' } },
  };
  const zoom = [{ type: 'inside' }, { type: 'slider', height: 22, bottom: 8, borderColor: grid, fillerColor: 'rgba(77,159,255,0.15)' }];

  if (tab.value === 'prices' && d.prices?.length) {
    return {
      backgroundColor: 'transparent',
      tooltip: { trigger: 'axis', backgroundColor: '#111922', borderColor: grid },
      grid: { left: 55, right: 20, top: 30, bottom: 65 },
      dataZoom: zoom,
      xAxis: { type: 'category', data: d.prices.map((r) => r.date), ...baseAxis },
      yAxis: { type: 'value', scale: true, ...baseAxis },
      series: [{
        name: '收盤價', type: 'line', data: d.prices.map((r) => Number(r.close_price)),
        smooth: true, symbol: 'none',
        lineStyle: { color: colors[0], width: 2 },
        areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [
          { offset: 0, color: 'rgba(77,159,255,0.25)' }, { offset: 1, color: 'rgba(77,159,255,0)' },
        ]}},
      }],
    };
  }
  if (tab.value === 'valuation' && d.valuation?.length) {
    return {
      backgroundColor: 'transparent',
      tooltip: { trigger: 'axis', backgroundColor: '#111922', borderColor: grid },
      legend: { data: ['PE', 'PB'], textStyle: { color: text }, top: 0 },
      grid: { left: 55, right: 55, top: 40, bottom: 65 },
      dataZoom: zoom,
      xAxis: { type: 'category', data: d.valuation.map((r) => r.date), ...baseAxis },
      yAxis: [
        { type: 'value', name: 'PE', ...baseAxis },
        { type: 'value', name: 'PB', ...baseAxis },
      ],
      series: [
        { name: 'PE', type: 'line', data: d.valuation.map((r) => r.pe_ratio), smooth: true, symbol: 'none', lineStyle: { color: colors[1] } },
        { name: 'PB', type: 'line', yAxisIndex: 1, data: d.valuation.map((r) => r.pb_ratio), smooth: true, symbol: 'none', lineStyle: { color: colors[2] } },
      ],
    };
  }
  if (tab.value === 'revenue' && d.revenue?.length) {
    return {
      backgroundColor: 'transparent',
      tooltip: { trigger: 'axis', backgroundColor: '#111922', borderColor: grid },
      grid: { left: 70, right: 20, top: 30, bottom: 65 },
      dataZoom: zoom,
      xAxis: { type: 'category', data: d.revenue.map((r) => String(r.revenue_month).slice(0, 7)), ...baseAxis },
      yAxis: { type: 'value', ...baseAxis },
      series: [{ name: '月營收', type: 'bar', data: d.revenue.map((r) => r.month_revenue), itemStyle: { color: colors[0], borderRadius: [3, 3, 0, 0] } }],
    };
  }
  if (tab.value === 'institutional' && d.trades?.length) {
    return {
      backgroundColor: 'transparent',
      tooltip: { trigger: 'axis', backgroundColor: '#111922', borderColor: grid },
      legend: { data: ['外資', '投信', '自營'], textStyle: { color: text }, top: 0 },
      grid: { left: 70, right: 20, top: 40, bottom: 65 },
      dataZoom: zoom,
      xAxis: { type: 'category', data: d.trades.map((r) => r.date), ...baseAxis },
      yAxis: { type: 'value', ...baseAxis },
      series: [
        { name: '外資', type: 'bar', data: d.trades.map((r) => r.foreign_total_net), itemStyle: { color: colors[0] } },
        { name: '投信', type: 'bar', data: d.trades.map((r) => r.investment_trust_net), itemStyle: { color: colors[1] } },
        { name: '自營', type: 'bar', data: d.trades.map((r) => r.dealer_total_net), itemStyle: { color: colors[2] } },
      ],
    };
  }
  if (tab.value === 'margin' && d.margin?.length) {
    return {
      backgroundColor: 'transparent',
      tooltip: { trigger: 'axis', backgroundColor: '#111922', borderColor: grid },
      legend: { data: ['融資餘額', '融券餘額'], textStyle: { color: text }, top: 0 },
      grid: { left: 70, right: 20, top: 40, bottom: 65 },
      dataZoom: zoom,
      xAxis: { type: 'category', data: d.margin.map((r) => r.date), ...baseAxis },
      yAxis: { type: 'value', ...baseAxis },
      series: [
        { name: '融資餘額', type: 'line', data: d.margin.map((r) => r.margin_balance), smooth: true, symbol: 'none', lineStyle: { color: colors[3] } },
        { name: '融券餘額', type: 'line', data: d.margin.map((r) => r.short_balance), smooth: true, symbol: 'none', lineStyle: { color: colors[1] } },
      ],
    };
  }
  return null;
});

const tableRows = computed(() => {
  const d = tabData.value;
  if (!d) return [];
  if (tab.value === 'returns') return d.returns || [];
  if (tab.value === 'balance') return d.balanceSheets || [];
  if (tab.value === 'income') return d.incomeStatements || [];
  if (tab.value === 'ratios') return d.ratios || [];
  return [];
});

const tableCols = computed(() => {
  const rows = tableRows.value;
  if (!rows.length) return [];
  return Object.keys(rows[0]).slice(0, 20);
});

function fmt(v) { return v == null ? '—' : Number(v).toFixed(2); }
function fmtBig(v) { return v == null ? '—' : Number(v).toLocaleString('zh-TW'); }

async function loadDetail() {
  loading.value = true;
  error.value = '';
  try { detail.value = await api.stockDetail(symbol.value); }
  catch (e) { error.value = e.message; }
  finally { loading.value = false; }
}

async function loadTab() {
  tabLoading.value = true;
  tabData.value = null;
  try {
    const s = symbol.value;
    const map = {
      prices: () => api.stockPrices(s, { limit: 500 }),
      valuation: () => api.stockValuation(s, { limit: 500 }),
      returns: () => api.stockReturns(s, { limit: 120 }),
      revenue: () => api.stockRevenue(s, { limit: 36 }),
      institutional: () => api.stockInstitutional(s, { limit: 120 }),
      margin: () => api.stockMargin(s, { limit: 120 }),
      balance: () => api.stockBalance(s),
      income: () => api.stockIncome(s),
      ratios: () => api.stockRatios(s),
    };
    tabData.value = await map[tab.value]();
  } catch { tabData.value = {}; }
  finally { tabLoading.value = false; }
}

function switchTab(k) { tab.value = k; loadTab(); }

watch(symbol, () => { loadDetail(); loadTab(); });
onMounted(() => { loadDetail(); loadTab(); });
</script>

<style scoped>
.ticker-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
  padding: 1.5rem 1.75rem;
  background: linear-gradient(135deg, var(--bg-card) 0%, #0f1929 100%);
}
.ticker-symbol {
  font-family: var(--mono);
  font-size: 2rem;
  font-weight: 800;
  color: var(--accent);
  letter-spacing: -0.03em;
  line-height: 1;
  margin-bottom: 0.35rem;
}
.ticker-name { font-size: 1rem; font-weight: 600; margin-bottom: 0.5rem; }
.ticker-meta { display: flex; align-items: center; gap: 0.5rem; }
.ticker-industry { font-size: 0.82rem; color: var(--text-muted); }
.ticker-price { text-align: right; }
.price-main { font-family: var(--mono); font-size: 2.25rem; font-weight: 700; letter-spacing: -0.02em; line-height: 1; }
.price-change { font-family: var(--mono); font-size: 1rem; font-weight: 600; margin: 0.25rem 0; }
.price-date { font-size: 0.75rem; color: var(--text-muted); }
.coverage-bar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  padding: 0.75rem 1.25rem;
  margin-bottom: 1.25rem;
  font-size: 0.8125rem;
  color: var(--text-muted);
}
.coverage-bar .dot { opacity: 0.4; }
.panel { min-height: 420px; }
</style>
