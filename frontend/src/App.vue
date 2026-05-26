<template>
  <div class="app-shell">
    <SidebarNav />
    <div class="main-area">
      <TopBar />
      <main class="main-content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
      <footer class="app-footer">
        <span>© {{ year }} QuantGems Financial Database</span>
        <span class="sep">·</span>
        <span>台股金融資料平台</span>
        <span class="sep">·</span>
        <a href="https://db.quantgems.com" target="_blank" rel="noopener">db.quantgems.com</a>
      </footer>
    </div>
  </div>
</template>

<script setup>
import SidebarNav from './components/SidebarNav.vue';
import TopBar from './components/TopBar.vue';

const year = new Date().getFullYear();
</script>

<style scoped>
.app-shell {
  display: flex;
  min-height: 100vh;
}
.main-area {
  flex: 1;
  margin-left: var(--sidebar-w);
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
.main-content { flex: 1; }
.app-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.85rem 1rem;
  border-top: 1px solid var(--border);
  font-size: 0.75rem;
  color: var(--text-muted);
  background: var(--bg-elevated);
}
.app-footer .sep { opacity: 0.4; }
.app-footer a { color: var(--text-muted); }
.app-footer a:hover { color: var(--accent); }
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
@media (max-width: 900px) {
  .main-area { margin-left: 0; }
}
</style>
