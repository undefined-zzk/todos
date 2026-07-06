<template>
  <div class="todo-stats">
    <div class="todo-stats__row">
      <span class="todo-stats__label">进度</span>
      <span class="todo-stats__value">{{ stats.completed }} / {{ stats.total }}</span>
      <span class="todo-stats__pct">{{ stats.progress }}%</span>
    </div>
    <div class="todo-stats__track" ref="trackRef">
      <div class="todo-stats__bar" :style="{ width: barWidth }" ref="barRef"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Progress summary with an animated bar. The bar width is driven by CSS
// transition; animejs adds a subtle pulse when reaching 100%.
const { stats } = useTodos()
const { run } = useAnime()
const barRef = ref<HTMLElement | null>(null)
const trackRef = ref<HTMLElement | null>(null)

const barWidth = computed(() => `${stats.value.progress}%`)

watch(
  () => stats.value.progress,
  (p) => {
    if (p === 100 && barRef.value) {
      run(barRef.value, { scale: [1, 1.02, 1], duration: 600, ease: 'outElastic(1, .6)' })
    }
  }
)
</script>

<style scoped>
.todo-stats {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 16px 18px;
  box-shadow: var(--shadow-sm);
}
.todo-stats__row {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 10px;
}
.todo-stats__label {
  font-size: 13px;
  color: var(--text-muted);
}
.todo-stats__value {
  font-size: 18px;
  font-weight: 700;
}
.todo-stats__pct {
  margin-left: auto;
  font-size: 13px;
  font-weight: 700;
  color: var(--primary);
}
.todo-stats__track {
  height: 8px;
  border-radius: 999px;
  background: var(--surface-2);
  overflow: hidden;
}
.todo-stats__bar {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--primary), #8a6bff);
  transition: width 0.5s cubic-bezier(0.22, 1, 0.36, 1);
}

@media (max-width: 640px) {
  .todo-stats { padding: 14px; }
  .todo-stats__value { font-size: 16px; }
  .todo-stats__pct { font-size: 12px; }
}
@media (max-width: 480px) {
  .todo-stats { padding: 12px; }
  .todo-stats__value { font-size: 15px; }
  .todo-stats__track { height: 6px; }
}
</style>
