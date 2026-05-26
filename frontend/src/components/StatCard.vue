<template>
  <div class="stat-card card">
    <div class="stat-label">{{ label }}</div>
    <div class="stat-value">{{ value }}</div>
    <div v-if="sub" class="stat-sub">{{ sub }}</div>
  </div>
</template>

<script setup>
defineProps({
  label: String,
  value: [String, Number],
  sub: String,
});
</script>

<style scoped>
.stat-card { padding: 1rem 1.15rem; }
.stat-label { font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.35rem; }
.stat-value { font-size: 1.5rem; font-weight: 700; font-family: var(--mono); }
.stat-sub { font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem; }
</style>
