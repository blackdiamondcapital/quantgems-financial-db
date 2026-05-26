<template>
  <div ref="el" class="chart-box"></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import * as echarts from 'echarts/core';
import { LineChart, BarChart, CandlestickChart } from 'echarts/charts';
import {
  GridComponent, TooltipComponent, LegendComponent, DataZoomComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([
  LineChart, BarChart, CandlestickChart,
  GridComponent, TooltipComponent, LegendComponent, DataZoomComponent,
  CanvasRenderer,
]);

const props = defineProps({
  option: { type: Object, required: true },
});

const el = ref(null);
let chart = null;

function render() {
  if (!el.value) return;
  if (!chart) chart = echarts.init(el.value, 'dark');
  chart.setOption(props.option, true);
}

onMounted(() => {
  render();
  window.addEventListener('resize', () => chart?.resize());
});

onBeforeUnmount(() => {
  chart?.dispose();
  window.removeEventListener('resize', () => chart?.resize());
});

watch(() => props.option, render, { deep: true });
</script>
