<template>
  <div class="todo-list">
    <ul class="todo-list__items" ref="listRef">
      <TodoItem
        v-for="todo in filteredTodos"
        :key="todo.id"
        :todo="todo"
        @removed="onRemoved"
      />
    </ul>
    <TodoEmpty v-if="!loading && filteredTodos.length === 0" :filter="filter" />
    <div v-if="loading" class="todo-list__loading">加载中…</div>
  </div>
</template>

<script setup lang="ts">
import type { TodoFilterType } from '~/types'

// Renders the filtered list and orchestrates entrance/leave animations.
// Items expose their root via a `data-id` attribute so newly added items
// can be animated individually without coupling to component internals.
const { filteredTodos, loading, filter, remove } = useTodos()
const { enterTodoItem, enterPage } = useAnime()

const listRef = ref<HTMLElement | null>(null)
const animatedIds = new Set<string>()

function queryItem(id: string): HTMLElement | null {
  return listRef.value?.querySelector(`[data-id="${id}"]`) ?? null
}

// Animate items that appear for the first time (initial load + newly added).
watch(
  () => filteredTodos.value.map(t => t.id),
  (ids, oldIds: string[] = []) => {
    const fresh = ids.filter((id) => !oldIds.includes(id) && !animatedIds.has(id))
    if (fresh.length === 0) return
    nextTick(() => {
      fresh.forEach((id, i) => {
        const el = queryItem(id)
        if (el) {
          enterTodoItem(el, i * 70)
          animatedIds.add(id)
        }
      })
    })
  },
  { immediate: true, flush: 'post' }
)

// Initial staggered entrance of the whole list.
onMounted(() => {
  if (listRef.value && filteredTodos.value.length > 0) {
    enterPage(listRef.value.querySelectorAll('.todo-item'))
    filteredTodos.value.forEach(t => animatedIds.add(t.id))
  }
})

function onRemoved(id: string) {
  animatedIds.delete(id)
  remove(id)
}
</script>

<style scoped>
.todo-list__items {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.todo-list__loading {
  text-align: center;
  padding: 24px;
  color: var(--text-subtle);
  font-size: 14px;
}
</style>
