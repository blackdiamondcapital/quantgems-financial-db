<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ currentTableLabel || '資料表瀏覽' }}</h1>
        <p class="page-sub">{{ currentTableLabel ? meta?.description : '結構化查詢引擎 · 分頁 · 排序 · 關鍵字篩選 · 唯讀模式' }}</p>
      </div>
    </div>

    <div class="toolbar card">
      <select v-model="selectedTable" class="input table-select" @change="onTableChange">
        <option value="">選擇資料表…</option>
        <optgroup v-for="(label, cat) in categories" :key="cat" :label="label">
          <option v-for="t in tablesByCategory(cat)" :key="t.name" :value="t.name">
            {{ t.label }}
          </option>
        </optgroup>
      </select>
      <div class="search-box">
        <AppIcon name="search" :size="16" class="s-icon" />
        <input v-model="searchQ" class="input" placeholder="關鍵字搜尋…" @keydown.enter="fetchData(1)" />
      </div>
      <button class="btn btn-primary" @click="fetchData(1)">查詢</button>
    </div>

    <div v-if="meta && result" class="meta-strip card">
      <span class="meta-title">{{ meta.label }}</span>
      <span class="badge" :class="categoryBadgeClass(meta.category)">{{ meta.categoryLabel || meta.category }}</span>
      <span class="meta-desc">{{ meta.description }}</span>
      <span class="meta-count">{{ result.total.toLocaleString() }} 列</span>
      <span v-if="result.sort" class="meta-sort">排序：{{ result.sort }} {{ result.order }}</span>
    </div>

    <div v-if="loading" class="loading"><div class="spinner"></div>查詢中…</div>
    <div v-else-if="error" class="error-box">{{ error }}</div>
    <template v-else-if="result">
      <div class="card table-card">
        <DataTable :columns="displayCols" :rows="result.rows" max-height="calc(100vh - 380px)" />
      </div>

      <div class="pager">
        <button class="btn" :disabled="page <= 1" @click="fetchData(page - 1)">← 上一頁</button>
        <span class="page-info">第 <strong>{{ page }}</strong> / {{ totalPages }} 頁</span>
        <button class="btn" :disabled="page >= totalPages" @click="fetchData(page + 1)">下一頁 →</button>
        <select v-model.number="limit" class="input limit-select" @change="fetchData(1)">
          <option :value="25">25 列/頁</option>
          <option :value="50">50 列/頁</option>
          <option :value="100">100 列/頁</option>
          <option :value="200">200 列/頁</option>
        </select>
      </div>
    </template>

    <div v-else class="empty-state card">
      <div class="empty-icon">🗂</div>
      <p>請從上方選擇資料表開始瀏覽</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { api } from '../services/api.js';
import { categoryBadgeClass, tableLabel } from '../constants.js';
import DataTable from '../components/DataTable.vue';
import AppIcon from '../components/AppIcon.vue';

const route = useRoute();
const router = useRouter();

const allTables = ref([]);
const selectedTable = ref(route.params.table || '');
const searchQ = ref('');
const loading = ref(false);
const error = ref('');
const result = ref(null);
const meta = ref(null);
const page = ref(1);
const limit = ref(50);

const categories = {
  market: '行情資料',
  valuation: '估值指標',
  financial: '財務報表',
  revenue: '營收資料',
  flow: '資金流向',
};

const totalPages = computed(() =>
  result.value ? Math.max(1, Math.ceil(result.value.total / limit.value)) : 1,
);

const currentTableLabel = computed(() =>
  selectedTable.value ? tableLabel(selectedTable.value) : '',
);

const displayCols = computed(() => {
  if (!result.value?.rows?.length) return result.value?.columns?.slice(0, 15) || [];
  return Object.keys(result.value.rows[0]).slice(0, 15);
});

function tablesByCategory(cat) {
  return allTables.value.filter((t) => t.category === cat);
}

async function fetchData(p = page.value) {
  if (!selectedTable.value) return;
  page.value = p;
  loading.value = true;
  error.value = '';
  try {
    result.value = await api.explore(selectedTable.value, {
      page: page.value,
      limit: limit.value,
      q: searchQ.value.trim() || undefined,
      order: 'desc',
    });
    meta.value = result.value.meta;
  } catch (e) {
    error.value = e.message;
    result.value = null;
  } finally {
    loading.value = false;
  }
}

function onTableChange() {
  router.replace({ name: 'explore', params: { table: selectedTable.value || undefined } });
  fetchData(1);
}

watch(() => route.params.table, (v) => {
  if (v && v !== selectedTable.value) {
    selectedTable.value = v;
    fetchData(1);
  }
});

onMounted(async () => {
  try {
    const data = await api.tables();
    allTables.value = data.tables;
    if (selectedTable.value) fetchData(1);
  } catch (e) {
    error.value = e.message;
  }
});
</script>

<style scoped>
.page-header { margin-bottom: 1.5rem; }
.toolbar {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1rem;
  padding: 1rem;
  flex-wrap: wrap;
  align-items: center;
}
.table-select { min-width: 300px; flex: 1; }
.search-box { flex: 2; min-width: 200px; position: relative; }
.s-icon {
  position: absolute;
  left: 0.85rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
  pointer-events: none;
}
.search-box .input { padding-left: 2.5rem; }
.meta-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text);
}
.meta-strip {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  padding: 0.75rem 1.25rem;
  margin-bottom: 1rem;
  font-size: 0.8125rem;
}
.meta-desc { color: var(--text-muted); flex: 1; }
.meta-count { font-family: var(--mono); color: var(--text-secondary); font-weight: 600; }
.meta-sort { font-family: var(--mono); font-size: 0.75rem; color: var(--text-muted); }
.table-card { padding: 0; overflow: hidden; }
.pager {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-top: 1.25rem;
  flex-wrap: wrap;
}
.page-info { font-size: 0.875rem; color: var(--text-muted); }
.page-info strong { color: var(--text); }
.limit-select { max-width: 130px; }
</style>
