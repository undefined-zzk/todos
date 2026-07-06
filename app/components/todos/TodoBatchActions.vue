<template>
  <transition name="batch-fade">
    <div v-if="visible" class="batch" ref="rootRef">
      <label class="batch__select" :class="{ 'is-checked': allSelected }">
        <input
          type="checkbox"
          :checked="allSelected"
          :indeterminate.prop="someSelected"
          @change="toggleSelectAll"
        />
        <span class="batch__select-box" aria-hidden="true">
          <svg v-if="allSelected" viewBox="0 0 24 24" width="14" height="14" fill="none">
            <path d="M4 12.5l5 5 11-11" stroke="currentColor" stroke-width="3"
              stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <svg v-else-if="someSelected" viewBox="0 0 24 24" width="14" height="14">
            <rect x="4" y="11" width="16" height="2" rx="1" fill="currentColor" />
          </svg>
        </span>
        <span class="batch__select-text">
          {{ selectedIds.length > 0 ? `已选 ${selectedIds.length} 项` : '全选' }}
        </span>
      </label>

      <div class="batch__actions">
        <button class="batch__btn" :disabled="!selectedIds.length" @click="onBatchActivate">
          标记未完成
        </button>
        <button class="batch__btn" :disabled="!selectedIds.length" @click="onBatchComplete">
          标记完成
        </button>
        <button
          class="batch__btn batch__btn--danger"
          :disabled="!selectedIds.length"
          @click="onBatchDelete"
        >
          删除所选
        </button>
        <button class="batch__btn batch__btn--ghost" :disabled="stats.completed === 0" @click="onClearCompleted">
          清除已完成
        </button>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
// Batch operation toolbar: select-all (with indeterminate state), mark
// complete/active, delete selected, and clear all completed. Only shows
// when there are todos to act on.
const {
  filteredTodos,
  selectedIds,
  allSelected,
  someSelected,
  stats,
  toggleSelectAll,
  batchComplete,
  batchActivate,
  batchDelete,
  clearCompleted,
  clearSelection
} = useTodos()
const { pressFeedback } = useAnime()

const rootRef = ref<HTMLElement | null>(null)

const visible = computed(() => filteredTodos.value.length > 0)

async function onBatchComplete() {
  pressFeedback(rootRef.value)
  await batchComplete()
  clearSelection()
}
async function onBatchActivate() {
  pressFeedback(rootRef.value)
  await batchActivate()
  clearSelection()
}
async function onBatchDelete() {
  pressFeedback(rootRef.value)
  await batchDelete()
}
async function onClearCompleted() {
  pressFeedback(rootRef.value)
  await clearCompleted()
}
</script>

<style scoped>
.batch {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  padding: 12px 16px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
}
.batch__select {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
}
.batch__select input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}
.batch__select-box {
  display: inline-grid;
  place-items: center;
  width: 20px;
  height: 20px;
  border-radius: 6px;
  border: 2px solid var(--border-strong);
  color: #fff;
  transition: background-color 0.18s ease, border-color 0.18s ease;
}
.batch__select.is-checked .batch__select-box {
  background: var(--primary);
  border-color: var(--primary);
}
.batch__actions {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-left: auto;
}
.batch__btn {
  height: 34px;
  padding: 0 14px;
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-weight: 600;
  background: var(--surface-2);
  color: var(--text-muted);
  transition: background-color 0.18s ease, color 0.18s ease, opacity 0.18s ease;
}
.batch__btn:hover:not(:disabled) {
  background: var(--primary-soft);
  color: var(--primary);
}
.batch__btn--danger:hover:not(:disabled) {
  background: var(--danger-soft);
  color: var(--danger);
}
.batch__btn--ghost {
  background: transparent;
}
.batch__btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.batch-fade-enter-active,
.batch-fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.batch-fade-enter-from,
.batch-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

@media (max-width: 640px) {
  .batch { padding: 10px 12px; gap: 10px; }
  .batch__actions { gap: 6px; }
  .batch__btn { height: 32px; padding: 0 10px; font-size: 12px; }
  .batch__select { font-size: 13px; }
}
@media (max-width: 480px) {
  .batch { flex-direction: column; align-items: stretch; }
  .batch__select { justify-content: center; }
  .batch__actions { margin-left: 0; justify-content: stretch; }
  .batch__btn { flex: 1; min-width: 0; }
}
</style>
