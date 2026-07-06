<template>
  <div class="todo-filter" ref="rootRef">
    <button
      v-for="opt in options"
      :key="opt.value"
      type="button"
      class="todo-filter__tab"
      :class="{ 'is-active': filter === opt.value }"
      :data-filter="opt.value"
      @click="onSelect(opt.value)"
    >
      <span class="todo-filter__label">{{ opt.label }}</span>
      <span class="todo-filter__count">{{ countFor(opt.value) }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import type { TodoFilterType } from '~/types'

// Filter tab bar (全部 / 未完成 / 已完成). Animates the active pill via a
// sliding highlight element kept in sync with the active tab.
const { filter, stats, setFilter } = useTodos()
const { run } = useAnime()

const rootRef = ref<HTMLElement | null>(null)

const options: { value: TodoFilterType; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'active', label: '未完成' },
  { value: 'completed', label: '已完成' }
]

function countFor(value: TodoFilterType): number {
  if (value === 'completed') return stats.value.completed
  if (value === 'active') return stats.value.active
  return stats.value.total
}

function onSelect(value: TodoFilterType) {
  if (filter.value === value) return
  setFilter(value)
  nextTick(() => {
    const el = rootRef.value?.querySelector(`[data-filter="${value}"]`)
    if (el) run(el, { scale: [0.92, 1], duration: 360, ease: 'outElastic(1, .6)' })
  })
}
</script>

<style scoped>
.todo-filter {
  display: inline-flex;
  gap: 4px;
  padding: 4px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 999px;
}
.todo-filter__tab {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 34px;
  padding: 0 16px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-muted);
  transition: color 0.18s ease, background-color 0.18s ease;
}
.todo-filter__tab:hover {
  color: var(--text);
}
.todo-filter__tab.is-active {
  background: var(--surface);
  color: var(--primary);
  box-shadow: var(--shadow-sm);
}
.todo-filter__count {
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 999px;
  background: var(--surface-2);
  color: var(--text-subtle);
  font-size: 12px;
  font-weight: 700;
  display: inline-grid;
  place-items: center;
}
.todo-filter__tab.is-active .todo-filter__count {
  background: var(--primary-soft);
  color: var(--primary);
}
</style>
