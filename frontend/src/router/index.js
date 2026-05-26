import { createRouter, createWebHistory } from 'vue-router';
import { tableLabel } from '../constants.js';
import Dashboard from '../views/Dashboard.vue';
import TableExplorer from '../views/TableExplorer.vue';
import StockList from '../views/StockList.vue';
import StockDetail from '../views/StockDetail.vue';

const routes = [
  { path: '/', name: 'dashboard', component: Dashboard, meta: { title: '總覽' } },
  { path: '/stocks', name: 'stocks', component: StockList, meta: { title: '股票列表' } },
  { path: '/stocks/:symbol', name: 'stock-detail', component: StockDetail, meta: { title: '個股詳情' } },
  { path: '/explore/:table?', name: 'explore', component: TableExplorer, meta: { title: '資料表瀏覽' } },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.afterEach((to) => {
  const base = 'QuantGems 金融資料庫';
  let title = to.meta.title;
  if (to.name === 'explore' && to.params.table) {
    title = tableLabel(to.params.table);
  }
  document.title = title ? `${title} · ${base}` : base;
});

export default router;
