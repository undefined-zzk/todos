import { describe, it, expect } from 'vitest'
import { todoService } from '~/services/todo.service'
import { storage } from '~/utils/storage'

// Service tests run against the in-memory Supabase fake (4-column todo
// table). completed/priority are stored as localStorage overrides, not in
// the DB, mirroring the real single-table setup.

describe('todoService (Supabase, 4-column table)', () => {
  it('list("all") returns an empty array when there are no todos', async () => {
    const res = await todoService.list('all')
    expect(res.success).toBe(true)
    expect(res.data).toEqual([])
  })

  it('create() inserts a todo and returns it mapped to the domain model', async () => {
    const res = await todoService.create({ title: '写测试', priority: 'high' })
    expect(res.success).toBe(true)
    expect(res.data.title).toBe('写测试')
    // priority is an override, not a DB column
    expect(res.data.priority).toBe('high')
    expect(res.data.completed).toBe(false)
    expect(typeof res.data.id).toBe('string')
  })

  it('list() reflects newly created todos', async () => {
    await todoService.create({ title: 'A' })
    await todoService.create({ title: 'B' })
    const res = await todoService.list('all')
    expect(res.data.length).toBe(2)
  })

  it('toggle() persists completed as an override and survives list()', async () => {
    const a = await todoService.create({ title: 'A' })
    await todoService.toggle(a.data.id, true)
    const res = await todoService.list('all')
    const found = res.data.find((t) => t.id === a.data.id)
    expect(found?.completed).toBe(true)
  })

  it('list("completed") only returns completed todos', async () => {
    const a = await todoService.create({ title: 'A' })
    await todoService.create({ title: 'B' })
    await todoService.toggle(a.data.id, true)
    const res = await todoService.list('completed')
    expect(res.data.length).toBe(1)
    expect(res.data[0]!.title).toBe('A')
  })

  it('list("active") only returns incomplete todos', async () => {
    const a = await todoService.create({ title: 'A' })
    await todoService.create({ title: 'B' })
    await todoService.toggle(a.data.id, true)
    const res = await todoService.list('active')
    expect(res.data.length).toBe(1)
    expect(res.data[0]!.title).toBe('B')
  })

  it('update() patches title/description in the DB', async () => {
    const created = await todoService.create({ title: '原标题' })
    const res = await todoService.update(created.data.id, {
      title: '新标题',
      description: '备注'
    })
    expect(res.success).toBe(true)
    expect(res.data.title).toBe('新标题')
    expect(res.data.description).toBe('备注')
  })

  it('toggle() flips completed via override', async () => {
    const created = await todoService.create({ title: '切换' })
    const on = await todoService.toggle(created.data.id, true)
    expect(on.data.completed).toBe(true)
    const off = await todoService.toggle(created.data.id, false)
    expect(off.data.completed).toBe(false)
  })

  it('remove() deletes a todo and cleans its overrides', async () => {
    const created = await todoService.create({ title: '将被删除' })
    await todoService.toggle(created.data.id, true)
    const res = await todoService.remove(created.data.id)
    expect(res.success).toBe(true)
    const after = await todoService.list('all')
    expect(after.data).toEqual([])
    // override for the deleted id should be gone
    const overrides = storage.get<Record<string, unknown>>('todos:overrides', {})
    expect(overrides[created.data.id]).toBeUndefined()
  })

  it('batch() updates completed overrides for every selected id', async () => {
    const a = await todoService.create({ title: '批1' })
    const b = await todoService.create({ title: '批2' })
    const res = await todoService.batch({
      ids: [a.data.id, b.data.id],
      completed: true
    })
    expect(res.success).toBe(true)
    expect(res.data.every((t) => t.completed)).toBe(true)
  })
})
