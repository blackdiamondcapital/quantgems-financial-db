<template>
  <div class="table-wrap" :style="{ maxHeight }">
    <table class="data-table">
      <thead>
        <tr>
          <th v-for="col in columns" :key="col">{{ col }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, i) in rows" :key="i">
          <td
            v-for="col in columns"
            :key="col"
            :class="{ num: isNumeric(row[col]) }"
          >
            {{ formatCell(row[col]) }}
          </td>
        </tr>
        <tr v-if="!rows.length">
          <td :colspan="columns.length || 1" class="empty">無資料</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
defineProps({
  columns: { type: Array, default: () => [] },
  rows: { type: Array, default: () => [] },
  maxHeight: { type: String, default: '520px' },
});

function isNumeric(v) {
  return v != null && v !== '' && Number.isFinite(Number(v));
}

function formatCell(v) {
  if (v == null) return '—';
  if (typeof v === 'object') return JSON.stringify(v);
  const n = Number(v);
  if (Number.isFinite(n) && String(v).match(/^-?\d/)) {
    if (Math.abs(n) >= 1000) return n.toLocaleString('zh-TW');
    if (String(v).includes('.')) return n.toFixed(4).replace(/\.?0+$/, '');
  }
  return String(v);
}
</script>

<style scoped>
.empty { text-align: center; color: var(--text-muted); padding: 2rem !important; }
</style>
