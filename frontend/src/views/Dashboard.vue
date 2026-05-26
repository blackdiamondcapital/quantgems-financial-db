<template>
  <div class="page">
    <div v-if="loading" class="loading"><div class="spinner"></div>載入資料庫狀態…</div>
    <div v-else-if="error" class="error-box">{{ error }}</div>
    <template v-else>
      <section class="hero">
        <div class="hero-badge">Taiwan Equity Research Platform</div>
        <h1 class="hero-title">QuantGems <span>金融資料庫</span></h1>
        <p class="hero-desc">
          整合台股行情、財務報表、估值指標、月營收與三大法人等結構化資料，
          提供機構級查詢介面，支援 {{ coverage.stockCount?.toLocaleString() || '—' }} 檔標的、
          {{ fmtBig(summary.totalRows) }} 筆歷史紀錄。
        </p>
        <div class="hero-actions">
          <router-link to="/stocks" class="btn btn-primary">瀏覽股票資料</router-link>
          <router-link to="/explore/tw_stock_prices" class="btn">資料表瀏覽</router-link>
        </div>
      </section>

      <p class="section-label">核心指標</p>
      <div class="grid-stats">
        <KpiCard label="收錄標的" :value="coverage.stockCount?.toLocaleString() || '—'" sub="股票基本資料" icon="📊" icon-color="var(--purple)" />
        <KpiCard label="總資料列" :value="fmtBig(summary.totalRows)" :sub="`${summary.activeTables} 張活躍資料表`" icon="🗄" icon-color="var(--accent)" />
        <KpiCard label="最新股價" :value="fmtDate(coverage.latestPriceDate)" sub="日線股價" icon="📈" icon-color="var(--green)" />
        <KpiCard label="最新法人" :value="fmtDate(coverage.latestInstitutionalDate)" sub="三大法人買賣超" icon="🏦" icon-color="var(--gold)" />
      </div>

      <p class="section-label">資料涵蓋範圍</p>
      <div class="grid-2">
        <div class="card">
          <div class="card-header">
            <h2 class="card-title">分類概況</h2>
          </div>
          <div class="category-list">
            <div v-for="cat in enrichedCategories" :key="cat.key" class="category-row">
              <div class="cat-info">
                <span class="badge" :class="categoryBadgeClass(cat.key)">{{ cat.label }}</span>
                <span class="cat-count">{{ cat.tables }} 張表 · {{ fmtBig(cat.rows) }} 列</span>
              </div>
              <div class="progress-bar">
                <div class="progress-bar-fill" :style="{ width: cat.pct + '%' }"></div>
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h2 class="card-title">快速入口</h2>
          </div>
          <div class="quick-links">
            <router-link
              v-for="t in topTables"
              :key="t.name"
              :to="`/explore/${t.name}`"
              class="quick-link"
            >
              <div class="ql-left">
                <span class="ql-name">{{ t.label }}</span>
                <span class="ql-desc">{{ t.description }}</span>
              </div>
              <div class="ql-right">
                <span class="ql-count">{{ fmtBig(t.count) }}</span>
                <AppIcon name="arrow-right" :size="14" />
              </div>
            </router-link>
          </div>
        </div>
      </div>

      <p class="section-label">完整資料目錄</p>
      <div class="card" style="padding:0; overflow:hidden;">
        <div class="table-wrap" style="border:none; border-radius:0;">
          <table class="data-table">
            <thead>
              <tr>
                <th>資料表名稱</th>
                <th>分類</th>
                <th>說明</th>
                <th class="num">資料列</th>
                <th>最新日期</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="t in tables" :key="t.name">
                <td><span class="table-name">{{ t.label }}</span></td>
                <td><span class="badge" :class="categoryBadgeClass(t.category)">{{ t.categoryLabel }}</span></td>
                <td class="desc">{{ t.description }}</td>
                <td class="num">{{ fmtBig(t.count) }}</td>
                <td class="date-cell">{{ t.latest || '—' }}</td>
                <td>
                  <router-link v-if="t.count > 0" :to="`/explore/${t.name}`" class="btn btn-sm">瀏覽</router-link>
                  <span v-else class="na">—</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { api } from '../services/api.js';
import { fmtBig, categoryBadgeClass } from '../constants.js';
import KpiCard from '../components/KpiCard.vue';
import AppIcon from '../components/AppIcon.vue';

const loading = ref(true);
const error = ref('');
const summary = ref({ totalTables: 0, activeTables: 0, totalRows: 0, categories: [] });
const tables = ref([]);
const coverage = ref({});

const enrichedCategories = computed(() => {
  const total = summary.value.totalRows || 1;
  return summary.value.categories.map((cat) => {
    const catTables = tables.value.filter((t) => t.category === cat.key);
    const rows = catTables.reduce((s, t) => s + t.count, 0);
    return { ...cat, rows, pct: Math.round((rows / total) * 100) };
  });
});

const topTables = computed(() =>
  tables.value.filter((t) => t.count > 0).slice(0, 6),
);

function fmtDate(v) {
  if (!v) return '—';
  return String(v).slice(0, 10);
}

onMounted(async () => {
  try {
    const data = await api.overview();
    summary.value = data.summary;
    tables.value = data.tables;
    coverage.value = data.coverage || {};
  } catch (e) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.hero-badge {
  display: inline-block;
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--gold);
  background: var(--gold-dim);
  border: 1px solid rgba(201, 168, 76, 0.2);
  border-radius: 999px;
  padding: 0.25rem 0.75rem;
  margin-bottom: 1rem;
}
.hero-actions { display: flex; gap: 0.75rem; flex-wrap: wrap; }
.category-list { display: flex; flex-direction: column; gap: 1rem; }
.category-row { display: flex; flex-direction: column; gap: 0.4rem; }
.cat-info { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }
.cat-count { font-size: 0.78rem; color: var(--text-muted); font-family: var(--mono); }
.quick-links { display: flex; flex-direction: column; gap: 0.35rem; }
.quick-link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 0.85rem;
  border-radius: var(--radius-sm);
  text-decoration: none;
  color: inherit;
  border: 1px solid transparent;
  transition: all 0.15s;
}
.quick-link:hover {
  background: var(--bg-hover);
  border-color: var(--border);
  text-decoration: none;
}
.ql-left { display: flex; flex-direction: column; gap: 0.15rem; }
.ql-name { font-size: 0.9rem; font-weight: 600; color: var(--text); }
.ql-desc { font-size: 0.78rem; color: var(--text-muted); }
.ql-right { display: flex; align-items: center; gap: 0.5rem; color: var(--text-muted); }
.ql-count { font-family: var(--mono); font-size: 0.8rem; }
.table-name { font-weight: 600; color: var(--text); }
.desc { max-width: 260px; white-space: normal; color: var(--text-muted); font-size: 0.82rem; }
.date-cell { font-family: var(--mono); font-size: 0.78rem; color: var(--text-secondary); }
.na { color: var(--text-muted); }
</style>
