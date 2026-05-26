<template>
  <aside class="sidebar">
    <router-link to="/" class="brand">
      <div class="brand-mark">QG</div>
      <div class="brand-info">
        <span class="brand-name">QuantGems</span>
        <span class="brand-sub">Financial Database</span>
      </div>
    </router-link>

    <nav class="sidebar-nav">
      <p class="nav-section">主選單</p>
      <router-link
        v-for="item in NAV_ITEMS"
        :key="item.to"
        :to="item.to"
        class="nav-item"
        :class="{ active: isActive(item.to) }"
      >
        <AppIcon :name="item.icon" :size="18" />
        <span>{{ item.label }}</span>
      </router-link>
    </nav>

    <div class="sidebar-footer">
      <div class="db-card" :class="{ ok: dbOk }">
        <AppIcon name="database" :size="16" />
        <div>
          <div class="db-label">{{ dbOk ? 'PostgreSQL 已連線' : '資料庫離線' }}</div>
          <div class="db-sub">quantgem · 唯讀模式</div>
        </div>
        <span class="status-dot" :class="{ ok: dbOk }"></span>
      </div>
      <div class="version">v1.0.0 · Taiwan Market Data</div>
    </div>
  </aside>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { api } from '../services/api.js';
import { NAV_ITEMS } from '../constants.js';
import AppIcon from './AppIcon.vue';

const route = useRoute();
const dbOk = ref(false);

function isActive(path) {
  if (path === '/') return route.path === '/';
  return route.path.startsWith(path);
}

onMounted(async () => {
  try {
    const h = await api.health();
    dbOk.value = h.ok;
  } catch {
    dbOk.value = false;
  }
});
</script>

<style scoped>
.sidebar {
  width: var(--sidebar-w);
  min-height: 100vh;
  background: var(--bg-elevated);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 200;
}
.brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.25rem 1.25rem 1rem;
  text-decoration: none;
  border-bottom: 1px solid var(--border);
}
.brand:hover { text-decoration: none; }
.brand-mark {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, #2563eb, #c9a84c);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 0.75rem;
  color: #fff;
  letter-spacing: -0.02em;
  flex-shrink: 0;
}
.brand-name {
  display: block;
  font-weight: 700;
  font-size: 0.95rem;
  color: var(--text);
  line-height: 1.2;
}
.brand-sub {
  display: block;
  font-size: 0.68rem;
  color: var(--text-muted);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.sidebar-nav {
  flex: 1;
  padding: 1rem 0.75rem;
}
.nav-section {
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-muted);
  padding: 0 0.75rem;
  margin: 0 0 0.5rem;
}
.nav-item {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.65rem 0.75rem;
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.15rem;
  transition: all 0.15s;
}
.nav-item:hover {
  background: var(--bg-hover);
  color: var(--text-secondary);
  text-decoration: none;
}
.nav-item.active {
  background: var(--accent-dim);
  color: var(--accent);
}
.sidebar-footer {
  padding: 1rem 0.75rem 1.25rem;
  border-top: 1px solid var(--border);
}
.db-card {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.75rem;
  border-radius: var(--radius-sm);
  background: var(--red-dim);
  border: 1px solid rgba(248, 113, 113, 0.15);
  color: var(--red);
  margin-bottom: 0.75rem;
}
.db-card.ok {
  background: var(--green-dim);
  border-color: rgba(52, 211, 153, 0.15);
  color: var(--green);
}
.db-label { font-size: 0.78rem; font-weight: 600; line-height: 1.2; }
.db-sub { font-size: 0.68rem; opacity: 0.75; margin-top: 0.1rem; }
.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--red);
  margin-left: auto;
  flex-shrink: 0;
  animation: pulse 2s infinite;
}
.status-dot.ok { background: var(--green); }
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
.version {
  font-size: 0.65rem;
  color: var(--text-muted);
  text-align: center;
  letter-spacing: 0.02em;
}
@media (max-width: 900px) {
  .sidebar { display: none; }
}
</style>
