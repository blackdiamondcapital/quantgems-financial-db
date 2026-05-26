<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">股票資料</h1>
        <p class="page-sub">台股標的基本資料 · 共 {{ totalLabel }} 檔</p>
      </div>
    </div>

    <div class="toolbar card">
      <div class="search-box">
        <AppIcon name="search" :size="16" class="s-icon" />
        <input v-model="q" class="input" placeholder="搜尋代號、名稱、簡稱…" @input="debouncedSearch" />
      </div>
      <select v-model="market" class="input filter-select" @change="search">
        <option value="">全部市場</option>
        <option v-for="m in markets" :key="m.market" :value="m.market">
          {{ m.market }} ({{ m.count }})
        </option>
      </select>
    </div>

    <div v-if="loading" class="loading"><div class="spinner"></div>搜尋中…</div>
    <div v-else-if="error" class="error-box">{{ error }}</div>
    <div v-else class="card table-card">
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>代號</th>
              <th>公司名稱</th>
              <th>簡稱</th>
              <th>市場</th>
              <th>產業</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in stocks" :key="s.symbol" class="clickable" @click="go(s.symbol)">
              <td><span class="sym-badge">{{ cleanSymbol(s.symbol) }}</span></td>
              <td class="name-cell">{{ s.name }}</td>
              <td>{{ s.short_name || '—' }}</td>
              <td><span class="badge badge-market">{{ s.market || '—' }}</span></td>
              <td class="industry-cell">{{ s.industry || '—' }}</td>
              <td><AppIcon name="arrow-right" :size="14" class="arrow" /></td>
            </tr>
            <tr v-if="!stocks.length">
              <td colspan="6">
                <div class="empty-state">
                  <div class="empty-icon">🔍</div>
                  <p>找不到符合條件的股票</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api } from '../services/api.js';
import AppIcon from '../components/AppIcon.vue';

const route = useRoute();
const router = useRouter();
const q = ref(route.query.q || '');
const market = ref('');
const stocks = ref([]);
const markets = ref([]);
const loading = ref(false);
const error = ref('');
let timer = null;

const totalLabel = computed(() => {
  if (q.value || market.value) return stocks.value.length;
  return markets.value.reduce((s, m) => s + m.count, 0) || '—';
});

function cleanSymbol(sym) {
  return String(sym).replace(/\.TW$|\.TWO$/i, '');
}

async function search() {
  loading.value = true;
  error.value = '';
  try {
    const params = { limit: 100 };
    if (q.value.trim()) params.q = q.value.trim();
    if (market.value) params.market = market.value;
    const data = await api.searchStocks(params);
    stocks.value = data.stocks;
  } catch (e) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}

function debouncedSearch() {
  clearTimeout(timer);
  timer = setTimeout(search, 300);
}

function go(symbol) {
  router.push({ name: 'stock-detail', params: { symbol } });
}

watch(() => route.query.q, (v) => { q.value = v || ''; search(); });

onMounted(async () => {
  try {
    const m = await api.stockMarkets();
    markets.value = m.markets;
  } catch { /* ignore */ }
  search();
});
</script>

<style scoped>
.page-header { margin-bottom: 1.5rem; }
.toolbar {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
  padding: 1rem;
  flex-wrap: wrap;
}
.search-box { flex: 1; min-width: 220px; position: relative; }
.s-icon {
  position: absolute;
  left: 0.85rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
  pointer-events: none;
}
.search-box .input { padding-left: 2.5rem; }
.filter-select { max-width: 200px; flex-shrink: 0; }
.table-card { padding: 0; overflow: hidden; }
.table-wrap { border: none; border-radius: 0; max-height: calc(100vh - 280px); }
.clickable { cursor: pointer; }
.clickable:hover .arrow { color: var(--accent); transform: translateX(2px); }
.sym-badge {
  font-family: var(--mono);
  font-weight: 600;
  font-size: 0.85rem;
  color: var(--accent);
  background: var(--accent-dim);
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
}
.name-cell { max-width: 280px; white-space: normal; font-weight: 500; }
.industry-cell { color: var(--text-muted); max-width: 160px; white-space: normal; font-size: 0.8rem; }
.arrow { color: var(--text-muted); transition: all 0.15s; }
</style>
