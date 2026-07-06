import { describe, it, expect, beforeEach } from 'vitest'
import { nextTick } from 'vue'
import { useTodos } from '~/composables/useTodos'
import type { Todo } from '~/types'

// Helpers
function fresh() {
  return useTodos()
}

// Non-null first element accessor (noUncheckedIndexedAccess-safe).
function first(list: Todo[]): Todo {
  return list[0]!
}
function at(list: Todo[], i: number): Todo {
  return list[i]!
}

async function seed(titles: string[]) {
  const t = fresh()
  for (const title of titles) {
    await t.add({ title, priority: 'medium' })
  }
  return t
}

describe('useTodos composable', () => {
  beforeEach(() => {
    // ensure clean useState store handled by setup afterEach + storage clear
  })

  describe('initial state', () => {
    it('starts empty with the "all" filter', () => {
      const t = fresh()
      expect(t.todos.value).toEqual([])
      expect(t.filter.value).toBe('all')
      expect(t.loading.value).toBe(false)
      expect(t.error.value).toBeNull()
      expect(t.selectedIds.value).toEqual([])
    })

    it('exposes zeroed stats', () => {
      const t = fresh()
      expect(t.stats.value).toEqual({
        total: 0,
        completed: 0,
        active: 0,
        progress: 0
      })
    })
  })

  describe('add()', () => {
    it('inserts a new todo at the front', async () => {
      const t = fresh()
      const created = await t.add({ title: '新任务' })
      expect(created).not.toBeNull()
      expect(t.todos.value.length).toBe(1)
      expect(first(t.todos.value).title).toBe('新任务')
      expect(first(t.todos.value).completed).toBe(false)
    })

    it('ignores empty titles', async () => {
      const t = fresh()
      const res = await t.add({ title: '   ' })
      expect(res).toBeNull()
      expect(t.todos.value.length).toBe(0)
    })

    it('defaults priority to medium', async () => {
      const t = fresh()
      const created = await t.add({ title: '默认优先级' })
      expect(created?.priority).toBe('medium')
    })

    it('sets mutating flag during the operation', async () => {
      const t = fresh()
      expect(t.mutating.value).toBe(false)
      const p = t.add({ title: '标志检查' })
      expect(t.mutating.value).toBe(true)
      await p
      expect(t.mutating.value).toBe(false)
    })
  })

  describe('toggle()', () => {
    it('flips completed and updates stats', async () => {
      const t = await seed(['任务A'])
      const id = first(t.todos.value).id
      await t.toggle(id)
      expect(first(t.todos.value).completed).toBe(true)
      expect(t.stats.value.completed).toBe(1)
      expect(t.stats.value.active).toBe(0)
      expect(t.stats.value.progress).toBe(100)
    })
  })

  describe('update()', () => {
    it('edits the title and description', async () => {
      const t = await seed(['原标题'])
      const id = first(t.todos.value).id
      await t.update(id, { title: '新标题', description: '备注内容' })
      expect(first(t.todos.value).title).toBe('新标题')
      expect(first(t.todos.value).description).toBe('备注内容')
    })
  })

  describe('remove()', () => {
    it('deletes by id and keeps selection consistent', async () => {
      const t = await seed(['A', 'B', 'C'])
      const idB = at(t.todos.value, 1).id
      t.selectedIds.value = [first(t.todos.value).id, idB]
      await t.remove(idB)
      expect(t.todos.value.map((x) => x.title)).toEqual(['C', 'A'])
      expect(t.selectedIds.value).not.toContain(idB)
    })

    it('remove() on an unknown id is a no-op (Supabase delete is idempotent)', async () => {
      const t = fresh()
      const ok = await t.remove('missing')
      // Supabase treats delete-by-unknown-id as success (idempotent).
      expect(ok).toBe(true)
      expect(t.todos.value).toEqual([])
    })
  })

  describe('filtering', () => {
    it('returns all / active / completed views correctly', async () => {
      // add() prepends, so seeding ['一','二','三'] yields order ['三','二','一'].
      const t = await seed(['一', '二', '三'])
      const idSan = at(t.todos.value, 2).id // '一'
      const idEr = at(t.todos.value, 1).id // '二'
      await t.toggle(idSan)
      await t.toggle(idEr)

      t.setFilter('all')
      expect(t.filteredTodos.value.length).toBe(3)

      t.setFilter('active')
      // only '三' is still incomplete
      expect(t.filteredTodos.value.map((x) => x.title)).toEqual(['三'])

      t.setFilter('completed')
      expect(t.filteredTodos.value.map((x) => x.title).sort()).toEqual(['一', '二'])
    })
  })

  describe('selection + batch ops', () => {
    it('toggleSelected adds/removes ids', () => {
      const t = fresh()
      t.toggleSelected('a')
      t.toggleSelected('b')
      expect(t.selectedIds.value).toEqual(['a', 'b'])
      t.toggleSelected('a')
      expect(t.selectedIds.value).toEqual(['b'])
    })

    it('toggleSelectAll selects/deselects within the filtered view', async () => {
      const t = await seed(['A', 'B', 'C'])
      t.setFilter('all')
      t.toggleSelectAll()
      expect(t.allSelected.value).toBe(true)
      expect(t.selectedIds.value.length).toBe(3)
      t.toggleSelectAll()
      expect(t.selectedIds.value).toEqual([])
    })

    it('batchComplete marks every selected todo complete', async () => {
      const t = await seed(['A', 'B'])
      t.selectedIds.value = t.todos.value.map((x) => x.id)
      await t.batchComplete()
      expect(t.todos.value.every((x) => x.completed)).toBe(true)
      expect(t.stats.value.progress).toBe(100)
    })

    it('batchActivate reverts todos to active', async () => {
      const t = await seed(['A', 'B'])
      // complete everything first
      await t.batchUpdate({ ids: t.todos.value.map((x) => x.id), completed: true })
      t.selectedIds.value = t.todos.value.map((x) => x.id)
      await t.batchActivate()
      expect(t.todos.value.every((x) => !x.completed)).toBe(true)
    })

    it('batchDelete removes the selected items', async () => {
      const t = await seed(['A', 'B', 'C'])
      const toDelete = first(t.todos.value).id
      t.selectedIds.value = [toDelete]
      await t.batchDelete()
      expect(t.todos.value.map((x) => x.id)).not.toContain(toDelete)
      expect(t.selectedIds.value).toEqual([])
    })

    it('clearCompleted removes only completed todos', async () => {
      // add() prepends, so seeding ['A','B','C'] yields order ['C','B','A'].
      const t = await seed(['A', 'B', 'C'])
      await t.toggle(at(t.todos.value, 2).id) // 'A' complete
      await t.clearCompleted()
      expect(t.todos.value.map((x) => x.title).sort()).toEqual(['B', 'C'])
    })
  })

  describe('init()', () => {
    it('init() loads todos from the service (empty table)', async () => {
      const t = fresh()
      await t.init()
      expect(t.loading.value).toBe(false)
      expect(t.todos.value).toEqual([])
    })

    it('init() loads todos previously created via the service', async () => {
      const seed = fresh()
      await seed.add({ title: '种子 A' })
      await seed.add({ title: '种子 B' })
      const t = fresh()
      await t.init()
      expect(t.todos.value.length).toBe(2)
    })
  })

  describe('stats', () => {
    it('computes progress as rounded percentage', async () => {
      const t = await seed(['A', 'B', 'C'])
      await t.toggle(first(t.todos.value).id)
      await nextTick()
      expect(t.stats.value.total).toBe(3)
      expect(t.stats.value.completed).toBe(1)
      expect(t.stats.value.active).toBe(2)
      expect(t.stats.value.progress).toBe(33)
    })
  })
})
