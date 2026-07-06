// Core todos state management.
//
// All mutations flow through the service layer (todoService) so the
// request framework, loading flags and error handling are exercised.
// LocalStorage mirrors the data for offline persistence; when a real
// backend is connected, drop the storage sync and rely on the API.
import { useState } from '#app'
import { computed } from 'vue'
import type { Todo, TodoBatchPayload, TodoCreatePayload, TodoFilterType, TodoUpdatePayload } from '~/types'
import { todoService } from '~/services/todo.service'
import { storage } from '~/utils/storage'

const STORAGE_KEY = 'todos'

export function useTodos() {
  const todos = useState<Todo[]>('todos:items', () => [])
  const filter = useState<TodoFilterType>('todos:filter', () => 'all')
  const loading = useState<boolean>('todos:loading', () => false)
  const mutating = useState<boolean>('todos:mutating', () => false)
  const error = useState<string | null>('todos:error', () => null)
  const selectedIds = useState<string[]>('todos:selected', () => [])

  // ---------- Getters ----------
  const filteredTodos = computed(() => {
    switch (filter.value) {
      case 'completed':
        return todos.value.filter(t => t.completed)
      case 'active':
        return todos.value.filter(t => !t.completed)
      default:
        return todos.value
    }
  })

  const stats = computed(() => {
    const total = todos.value.length
    const completed = todos.value.filter(t => t.completed).length
    return {
      total,
      completed,
      active: total - completed,
      progress: total === 0 ? 0 : Math.round((completed / total) * 100)
    }
  })

  const allSelected = computed(
    () =>
      filteredTodos.value.length > 0 &&
      filteredTodos.value.every(t => selectedIds.value.includes(t.id))
  )
  const someSelected = computed(
    () => selectedIds.value.length > 0 && !allSelected.value
  )

  // ---------- Persistence helpers ----------
  function persist() {
    storage.set(STORAGE_KEY, todos.value)
  }

  // ---------- Actions ----------
  async function init() {
    loading.value = true
    error.value = null
    try {
      const res = await todoService.list('all')
      if (res.success) {
        todos.value = res.data
      } else {
        error.value = res.message ?? '加载失败'
      }
    } catch (e) {
      error.value = (e as { message?: string })?.message ?? '加载失败'
    } finally {
      loading.value = false
    }
  }

  async function add(payload: TodoCreatePayload) {
    if (!payload.title.trim()) return null
    mutating.value = true
    error.value = null
    try {
      const res = await todoService.create(payload)
      if (res.success) {
        todos.value.unshift(res.data)
        persist()
        return res.data
      }
      error.value = res.message ?? '创建失败'
      return null
    } catch (e) {
      error.value = (e as { message?: string })?.message ?? '创建失败'
      return null
    } finally {
      mutating.value = false
    }
  }

  async function update(id: string, payload: TodoUpdatePayload) {
    mutating.value = true
    error.value = null
    try {
      const res = await todoService.update(id, payload)
      if (res.success) {
        const idx = todos.value.findIndex(t => t.id === id)
        if (idx !== -1) todos.value[idx] = res.data
        persist()
        return res.data
      }
      error.value = res.message ?? '更新失败'
      return null
    } catch (e) {
      error.value = (e as { message?: string })?.message ?? '更新失败'
      return null
    } finally {
      mutating.value = false
    }
  }

  async function remove(id: string) {
    mutating.value = true
    error.value = null
    try {
      const res = await todoService.remove(id)
      if (res.success) {
        todos.value = todos.value.filter(t => t.id !== id)
        selectedIds.value = selectedIds.value.filter(sid => sid !== id)
        persist()
        return true
      }
      error.value = res.message ?? '删除失败'
      return false
    } catch (e) {
      error.value = (e as { message?: string })?.message ?? '删除失败'
      return false
    } finally {
      mutating.value = false
    }
  }

  async function toggle(id: string) {
    const target = todos.value.find(t => t.id === id)
    if (!target) return
    return update(id, { completed: !target.completed })
  }

  async function batchUpdate(payload: TodoBatchPayload) {
    if (payload.ids.length === 0) return
    mutating.value = true
    error.value = null
    try {
      const res = await todoService.batch(payload)
      if (res.success) {
        const updatedMap = new Map(res.data.map(t => [t.id, t]))
        todos.value = todos.value.map(t => updatedMap.get(t.id) ?? t)
        persist()
      }
    } catch (e) {
      error.value = (e as { message?: string })?.message ?? '批量操作失败'
    } finally {
      mutating.value = false
    }
  }

  async function batchComplete() {
    await batchUpdate({ ids: selectedIds.value, completed: true })
  }

  async function batchActivate() {
    await batchUpdate({ ids: selectedIds.value, completed: false })
  }

  async function batchDelete() {
    const ids = [...selectedIds.value]
    if (ids.length === 0) return
    mutating.value = true
    error.value = null
    try {
      await Promise.all(ids.map(id => todoService.remove(id)))
      todos.value = todos.value.filter(t => !ids.includes(t.id))
      selectedIds.value = []
      persist()
    } catch (e) {
      error.value = (e as { message?: string })?.message ?? '批量删除失败'
    } finally {
      mutating.value = false
    }
  }

  async function clearCompleted() {
    const completedIds = todos.value.filter(t => t.completed).map(t => t.id)
    if (completedIds.length === 0) return
    const prevSelection = [...selectedIds.value]
    selectedIds.value = completedIds
    await batchDelete()
    selectedIds.value = prevSelection
  }

  // ---------- Selection ----------
  function toggleSelected(id: string) {
    selectedIds.value = selectedIds.value.includes(id)
      ? selectedIds.value.filter(sid => sid !== id)
      : [...selectedIds.value, id]
  }

  function toggleSelectAll() {
    if (allSelected.value) {
      selectedIds.value = selectedIds.value.filter(
        id => !filteredTodos.value.some(t => t.id === id)
      )
    } else {
      const ids = filteredTodos.value.map(t => t.id)
      selectedIds.value = [...new Set([...selectedIds.value, ...ids])]
    }
  }

  function clearSelection() {
    selectedIds.value = []
  }

  function setFilter(value: TodoFilterType) {
    filter.value = value
  }

  return {
    // state
    todos,
    filter,
    loading,
    mutating,
    error,
    selectedIds,
    // getters
    filteredTodos,
    stats,
    allSelected,
    someSelected,
    // actions
    init,
    add,
    update,
    remove,
    toggle,
    batchUpdate,
    batchComplete,
    batchActivate,
    batchDelete,
    clearCompleted,
    // selection
    toggleSelected,
    toggleSelectAll,
    clearSelection,
    setFilter
  }
}
