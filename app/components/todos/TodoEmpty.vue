<template>
  <div class="todo-empty" ref="rootRef">
    <div class="todo-empty__icon" aria-hidden="true">
      <svg viewBox="0 0 64 64" width="56" height="56" fill="none">
        <circle cx="32" cy="32" r="28" stroke="currentColor" stroke-width="2" stroke-dasharray="4 5" />
        <path d="M22 33l7 7 14-15" stroke="currentColor" stroke-width="3"
          stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </div>
    <p class="todo-empty__title">{{ title }}</p>
    <p class="todo-empty__hint">{{ hint }}</p>
  </div>
</template>

<script setup lang="ts">
import type { TodoFilterType } from '~/types'

// Friendly empty state shown when the filtered list has no items.
const props = defineProps<{ filter: TodoFilterType }>()
const { enterElement } = useAnime()
const rootRef = ref<HTMLElement | null>(null)

const title = computed(() => {
  if (props.filter === 'completed') return '还没有已完成的待办'
  if (props.filter === 'active') return '太棒了，没有未完成的待办'
  return '开始添加你的第一个待办吧'
})
const hint = computed(() => {
  if (props.filter === 'completed') return '完成的任务会出现在这里'
  if (props.filter === 'active') return '所有任务都已完成，休息一下吧'
  return '在上方输入框中输入标题后回车即可添加'
})

onMounted(() => {
  if (rootRef.value) enterElement(rootRef.value, 120)
})
</script>

<style scoped>
.todo-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 48px 20px;
  color: var(--text-subtle);
}
.todo-empty__icon {
  color: var(--border-strong);
  margin-bottom: 14px;
}
.todo-empty__title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-muted);
}
.todo-empty__hint {
  margin-top: 6px;
  font-size: 13px;
}
</style>
