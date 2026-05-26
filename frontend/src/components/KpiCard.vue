<template>
  <div class="kpi-card card">
    <div class="kpi-top">
      <span class="kpi-label">{{ label }}</span>
      <span v-if="icon" class="kpi-icon" :style="{ color: iconColor }">{{ icon }}</span>
    </div>
    <div class="kpi-value" :class="valueClass">{{ value }}</div>
    <div v-if="sub" class="kpi-sub">{{ sub }}</div>
    <div v-if="progress != null" class="progress-bar" style="margin-top:0.75rem">
      <div class="progress-bar-fill" :style="{ width: progress + '%' }"></div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  label: String,
  value: [String, Number],
  sub: String,
  icon: String,
  iconColor: { type: String, default: 'var(--accent)' },
  valueClass: String,
  progress: Number,
});
</script>

<style scoped>
.kpi-card { padding: 1.1rem 1.25rem; }
.kpi-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}
.kpi-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--text-muted);
  letter-spacing: 0.02em;
}
.kpi-icon { font-size: 1rem; opacity: 0.8; }
.kpi-value {
  font-size: 1.625rem;
  font-weight: 700;
  font-family: var(--mono);
  letter-spacing: -0.02em;
  line-height: 1.2;
}
.kpi-sub {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-top: 0.3rem;
}
</style>
