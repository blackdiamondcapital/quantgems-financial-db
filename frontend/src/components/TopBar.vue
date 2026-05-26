<template>
  <header class="topbar">
    <div class="topbar-left">
      <nav v-if="breadcrumbs.length" class="breadcrumbs">
        <template v-for="(crumb, i) in breadcrumbs" :key="i">
          <span v-if="i > 0" class="sep">/</span>
          <router-link v-if="crumb.to" :to="crumb.to">{{ crumb.label }}</router-link>
          <span v-else class="current">{{ crumb.label }}</span>
        </template>
      </nav>
    </div>
    <div class="topbar-search">
      <AppIcon name="search" :size="16" class="search-icon" />
      <input
        v-model="query"
        class="input search-input"
        placeholder="快速搜尋股票代號、名稱…"
        @keydown.enter="goSearch"
      />
      <kbd class="kbd">↵</kbd>
    </div>
    <div class="topbar-right">
      <span class="clock">{{ now }}</span>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { tableLabel } from '../constants.js';
import AppIcon from './AppIcon.vue';

const route = useRoute();
const router = useRouter();
const query = ref('');
const now = ref('');

const breadcrumbs = computed(() => {
  const items = [{ label: '控制台', to: '/' }];
  if (route.name === 'stocks') items.push({ label: '股票資料' });
  if (route.name === 'stock-detail') {
    items.push({ label: '股票資料', to: '/stocks' });
    items.push({ label: route.params.symbol });
  }
  if (route.name === 'explore') {
    items.push({ label: '資料表瀏覽', to: '/explore' });
    if (route.params.table) items.push({ label: tableLabel(route.params.table) });
  }
  return items;
});

function goSearch() {
  const q = query.value.trim();
  if (!q) return;
  router.push({ name: 'stocks', query: { q } });
}

function tick() {
  now.value = new Date().toLocaleString('zh-TW', {
    month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  });
}

let timer;
onMounted(() => { tick(); timer = setInterval(tick, 1000); });
onBeforeUnmount(() => clearInterval(timer));
</script>

<style scoped>
.topbar {
  height: var(--topbar-h);
  display: flex;
  align-items: center;
  gap: 1.25rem;
  padding: 0 2rem;
  background: var(--bg-elevated);
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  z-index: 100;
}
.topbar-left { flex-shrink: 0; }
.breadcrumbs {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8125rem;
}
.breadcrumbs a { color: var(--text-muted); text-decoration: none; }
.breadcrumbs a:hover { color: var(--accent); }
.breadcrumbs .sep { color: var(--border-light); }
.breadcrumbs .current { color: var(--text-secondary); font-weight: 500; }
.topbar-search {
  flex: 1;
  max-width: 480px;
  position: relative;
}
.search-icon {
  position: absolute;
  left: 0.85rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
  pointer-events: none;
}
.search-input {
  padding-left: 2.5rem;
  padding-right: 2.5rem;
  background: var(--bg-card);
}
.kbd {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.65rem;
  color: var(--text-muted);
  background: var(--bg-hover);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 0.1rem 0.35rem;
  font-family: var(--mono);
}
.topbar-right { margin-left: auto; }
.clock {
  font-family: var(--mono);
  font-size: 0.8125rem;
  color: var(--text-muted);
  letter-spacing: 0.02em;
}
@media (max-width: 900px) {
  .topbar { padding: 0 1rem; }
  .breadcrumbs { display: none; }
}
</style>
