<template>
  <li
    class="todo-item"
    :class="{ 'is-completed': todo.completed, 'is-selected': isSelected }"
    :data-id="todo.id"
    ref="rootRef"
  >
    <label class="todo-item__check" :for="checkboxId">
      <input
        :id="checkboxId"
        type="checkbox"
        class="todo-item__checkbox"
        :checked="todo.completed"
        @change="onToggle"
        ref="checkboxRef"
      />
      <span class="todo-item__box" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" ref="checkRef">
          <path d="M4 12.5l5 5 11-11" stroke="currentColor" stroke-width="3"
            stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </span>
    </label>

    <div class="todo-item__body">
      <template v-if="!editing">
        <button class="todo-item__title" @dblclick="startEdit">{{ todo.title }}</button>
        <p v-if="todo.description" class="todo-item__desc">{{ todo.description }}</p>
        <div class="todo-item__meta">
          <span class="badge" :class="`badge--${todo.priority}`">{{ priorityLabel }}</span>
          <span class="todo-item__time">{{ formattedTime }}</span>
        </div>
      </template>
      <template v-else>
        <input
          ref="editInputRef"
          v-model="draftTitle"
          class="todo-item__edit"
          maxlength="120"
          @keyup.enter="commitEdit"
          @keyup.escape="cancelEdit"
          @blur="commitEdit"
        />
        <input
          v-model="draftDesc"
          class="todo-item__edit todo-item__edit--desc"
          placeholder="备注（可选）"
          maxlength="200"
          @keyup.escape="cancelEdit"
        />
      </template>
    </div>

    <div class="todo-item__actions">
      <button
        class="icon-btn"
        :title="editing ? '保存' : '编辑'"
        @click="editing ? commitEdit() : startEdit()"
      >
        <svg v-if="!editing" viewBox="0 0 24 24" width="16" height="16" fill="none">
          <path d="M4 20h4l11-11-4-4L4 16v4z" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        <svg v-else viewBox="0 0 24 24" width="16" height="16" fill="none">
          <path d="M5 12l5 5 9-9" stroke="currentColor" stroke-width="2.4"
            stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
      <button
        v-if="!editing"
        class="icon-btn icon-btn--danger"
        title="删除"
        @click="onDelete"
        :disabled="mutating"
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
          <path d="M6 7h12M9 7V5h6v2m-7 0l1 13h6l1-13" stroke="currentColor"
            stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
      <button v-else class="icon-btn" title="取消" @click="cancelEdit">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
          <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.4"
            stroke-linecap="round" />
        </svg>
      </button>
    </div>
  </li>
</template>

<script setup lang="ts">
import type { Todo, TodoPriority } from '~/types'

// Single todo row. Handles inline edit, complete toggle and delete with
// animejs transitions. Emits `removed` so the list can play a leave
// animation before the item actually disappears from the DOM.
const props = defineProps<{ todo: Todo }>()
const emit = defineEmits<{
  (e: 'removed', id: string): void
}>()

const { update, toggle, selectedIds, mutating } = useTodos()
const { popComplete, leaveTodoItem } = useAnime()

const rootRef = ref<HTMLElement | null>(null)
const checkboxRef = ref<HTMLInputElement | null>(null)
const checkRef = ref<HTMLElement | null>(null)

const editing = ref(false)
const draftTitle = ref('')
const draftDesc = ref('')
const editInputRef = ref<HTMLInputElement | null>(null)

const checkboxId = computed(() => `todo-check-${props.todo.id}`)
const isSelected = computed(() => selectedIds.value.includes(props.todo.id))

const priorityLabel = computed(() => {
  const map: Record<TodoPriority, string> = { low: '低', medium: '中', high: '高' }
  return map[props.todo.priority]
})

const formattedTime = computed(() => {
  const diff = Date.now() - props.todo.updatedAt
  const min = 60 * 1000
  const hour = 60 * min
  const day = 24 * hour
  if (diff < min) return '刚刚'
  if (diff < hour) return `${Math.floor(diff / min)} 分钟前`
  if (diff < day) return `${Math.floor(diff / hour)} 小时前`
  if (diff < 7 * day) return `${Math.floor(diff / day)} 天前`
  return new Date(props.todo.updatedAt).toLocaleDateString()
})

async function onToggle() {
  await toggle(props.todo.id)
  if (checkRef.value) popComplete(checkRef.value)
}

function startEdit() {
  draftTitle.value = props.todo.title
  draftDesc.value = props.todo.description ?? ''
  editing.value = true
  nextTick(() => editInputRef.value?.focus())
}

function cancelEdit() {
  editing.value = false
}

async function commitEdit() {
  if (!editing.value) return
  const title = draftTitle.value.trim()
  if (!title) {
    cancelEdit()
    return
  }
  editing.value = false
  if (title !== props.todo.title || draftDesc.value.trim() !== (props.todo.description ?? '')) {
    await update(props.todo.id, {
      title,
      description: draftDesc.value.trim() || undefined
    })
  }
}

function onDelete() {
  if (!rootRef.value) {
    emit('removed', props.todo.id)
    return
  }
  // Play leave animation, then notify parent to remove the data.
  leaveTodoItem(rootRef.value, () => {
    emit('removed', props.todo.id)
  })
}
</script>

<style scoped>
.todo-item {
  list-style: none;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
  transition: border-color 0.18s ease, box-shadow 0.18s ease,
    background-color 0.18s ease;
  overflow: hidden;
  will-change: height, opacity, transform;
}
.todo-item:hover {
  border-color: var(--border-strong);
  box-shadow: var(--shadow);
}
.todo-item.is-completed {
  background: var(--surface-2);
}
.todo-item.is-selected {
  border-color: var(--primary);
}

.todo-item__check {
  flex: 0 0 auto;
  margin-top: 2px;
  cursor: pointer;
}
.todo-item__checkbox {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}
.todo-item__box {
  display: inline-grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid var(--border-strong);
  color: #fff;
  transition: background-color 0.2s ease, border-color 0.2s ease;
}
.todo-item__box svg {
  transform: scale(0);
}
.todo-item.is-completed .todo-item__box {
  background: var(--success);
  border-color: var(--success);
}
.todo-item.is-completed .todo-item__box svg {
  color: #fff;
}

.todo-item__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.todo-item__title {
  text-align: left;
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
  word-break: break-word;
  transition: color 0.2s ease, text-decoration-color 0.2s ease;
}
.todo-item.is-completed .todo-item__title {
  color: var(--text-subtle);
  text-decoration: line-through;
}
.todo-item__desc {
  font-size: 13px;
  color: var(--text-muted);
  word-break: break-word;
}
.todo-item.is-completed .todo-item__desc {
  color: var(--text-subtle);
}
.todo-item__meta {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}
.todo-item__time {
  font-size: 12px;
  color: var(--text-subtle);
}

.badge {
  display: inline-flex;
  align-items: center;
  height: 20px;
  padding: 0 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
}
.badge--low { background: var(--surface-2); color: var(--text-muted); }
.badge--medium { background: var(--warning-soft); color: var(--warning); }
.badge--high { background: var(--danger-soft); color: var(--danger); }

.todo-item__edit {
  width: 100%;
  height: 38px;
  padding: 0 12px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--primary);
  background: var(--bg);
  box-shadow: 0 0 0 3px var(--primary-soft);
}
.todo-item__edit:focus { outline: none; }
.todo-item__edit--desc {
  height: 34px;
  border-color: var(--border);
  box-shadow: none;
}

.todo-item__actions {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex: 0 0 auto;
}
.icon-btn {
  display: inline-grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  color: var(--text-muted);
  transition: background-color 0.18s ease, color 0.18s ease, transform 0.18s ease;
}
.icon-btn:hover {
  background: var(--surface-2);
  color: var(--text);
}
.icon-btn:active { transform: scale(0.92); }
.icon-btn--danger:hover {
  background: var(--danger-soft);
  color: var(--danger);
}
.icon-btn:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
