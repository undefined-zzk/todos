<template>
  <form class="todo-input" @submit.prevent="onSubmit" ref="rootRef">
    <div class="todo-input__row">
      <input
        ref="inputRef"
        v-model="title"
        class="todo-input__field"
        type="text"
        :placeholder="placeholder"
        maxlength="120"
        aria-label="待办标题"
      />
      <select v-model="priority" class="todo-input__select" aria-label="优先级">
        <option value="low">低</option>
        <option value="medium">中</option>
        <option value="high">高</option>
      </select>
      <button
        class="todo-input__btn"
        type="submit"
        :disabled="!canSubmit || mutating"
      >
        <span v-if="mutating" class="spinner" aria-hidden="true"></span>
        <span>{{ mutating ? '添加中' : '添加' }}</span>
      </button>
    </div>
    <input
      v-model="description"
      class="todo-input__desc"
      type="text"
      placeholder="备注（可选）"
      maxlength="200"
      aria-label="待办备注"
    />
  </form>
</template>

<script setup lang="ts">
import type { TodoPriority } from '~/types'

// New-todo entry form. Emits nothing; calls useTodos.add directly so the
// request framework + loading states are exercised, then animates the focus.
const props = withDefaults(
  defineProps<{ placeholder?: string }>(),
  { placeholder: '添加一个新的待办…' }
)

const { add, mutating } = useTodos()
const { pressFeedback } = useAnime()

const rootRef = ref<HTMLElement | null>(null)
const inputRef = ref<HTMLInputElement | null>(null)
const title = ref('')
const description = ref('')
const priority = ref<TodoPriority>('medium')

const canSubmit = computed(() => title.value.trim().length > 0)

async function onSubmit() {
  if (!canSubmit.value) {
    pressFeedback(rootRef.value)
    return
  }
  const created = await add({
    title: title.value,
    description: description.value || undefined,
    priority: priority.value
  })
  if (created) {
    title.value = ''
    description.value = ''
    priority.value = 'medium'
    await nextTick()
    inputRef.value?.focus()
  }
}
</script>

<style scoped>
.todo-input {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 14px;
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.todo-input__row {
  display: flex;
  gap: 10px;
}
.todo-input__field {
  flex: 1;
  min-width: 0;
  height: 44px;
  padding: 0 14px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: var(--bg);
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
}
.todo-input__field:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-soft);
}
.todo-input__select {
  height: 44px;
  padding: 0 12px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: var(--bg);
  cursor: pointer;
}
.todo-input__select:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-soft);
}
.todo-input__btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 44px;
  padding: 0 22px;
  border-radius: var(--radius-sm);
  background: var(--primary);
  color: #fff;
  font-weight: 600;
  transition: background-color 0.18s ease, transform 0.18s ease, opacity 0.18s ease;
}
.todo-input__btn:hover:not(:disabled) {
  background: var(--primary-hover);
}
.todo-input__btn:active:not(:disabled) {
  transform: scale(0.97);
}
.todo-input__btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.todo-input__desc {
  height: 40px;
  padding: 0 14px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: var(--bg);
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
}
.todo-input__desc:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-soft);
}

.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.5);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 640px) {
  .todo-input { padding: 12px; }
  .todo-input__field { height: 40px; font-size: 14px; }
  .todo-input__select { height: 40px; font-size: 13px; padding: 0 8px; }
  .todo-input__btn { height: 40px; padding: 0 16px; font-size: 13px; }
  .todo-input__desc { height: 36px; font-size: 13px; }
}
@media (max-width: 480px) {
  .todo-input__row { flex-wrap: wrap; }
  .todo-input__field { flex: 1 1 100%; }
  .todo-input__select { flex: 1; }
  .todo-input__btn { flex: 1; }
}
</style>
