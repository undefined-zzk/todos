// Todo service: Supabase implementation adapted to the existing
// `public.todo` table with columns (id, title, description, created_at).
//
// Note: the table has no `completed` / `priority` / `updated_at` columns,
// so those fields are NOT persisted to the database. They are kept in
// memory by the useTodos composable (via localStorage mirror) so the UI
// still supports completion toggling and priority badges within a session.
// To persist them, add the columns via ALTER TABLE and restore the full
// mapping below.
import type {
  ApiResponse,
  Todo,
  TodoBatchPayload,
  TodoCreatePayload,
  TodoFilterType,
  TodoUpdatePayload
} from '~/types'
import { storage } from '~/utils/storage'

// Row shape returned by Supabase for the existing 4-column table.
interface TodoRow {
  id: string
  title: string
  description: string | null
  created_at: string
}

// In-memory overrides for fields the DB doesn't store. Keyed by todo id.
// Persisted to localStorage so completion survives a page reload within
// the same browser, even though it's not in the DB.
const OVERRIDE_KEY = 'todos:overrides'
interface Overrides {
  [id: string]: { completed?: boolean; priority?: Todo['priority'] }
}

function loadOverrides(): Overrides {
  return storage.get<Overrides>(OVERRIDE_KEY, {})
}
function saveOverrides(o: Overrides) {
  storage.set(OVERRIDE_KEY, o)
}

function ok<T>(data: T, message = 'success'): ApiResponse<T> {
  return { data, success: true, message }
}

function fail<T>(data: T, message: string, code?: number): ApiResponse<T> {
  return { data, success: false, message, code }
}

// Map a Supabase row to the app's Todo domain model, layering in-memory
// overrides for completed/priority.
function toTodo(row: TodoRow, overrides: Overrides): Todo {
  const ov = overrides[row.id] ?? {}
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    completed: ov.completed ?? false,
    priority: ov.priority ?? 'medium',
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.created_at).getTime()
  }
}

function toInsert(payload: TodoCreatePayload) {
  return {
    title: payload.title.trim(),
    description: payload.description?.trim() || null
  }
}

function getSupabase() {
  return useNuxtApp().$supabase
}

export const todoService = {
  async list(filter: TodoFilterType = 'all'): Promise<ApiResponse<Todo[]>> {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('todo')
      .select('id,title,description,created_at')
      .order('created_at', { ascending: false })
    if (error) return fail<Todo[]>([], error.message, Number(error.code) || 500)
    const overrides = loadOverrides()
    let todos = (data as TodoRow[]).map((r) => toTodo(r, overrides))
    if (filter === 'completed') todos = todos.filter((t) => t.completed)
    else if (filter === 'active') todos = todos.filter((t) => !t.completed)
    return ok(todos)
  },

  async create(payload: TodoCreatePayload): Promise<ApiResponse<Todo>> {
    const supabase = getSupabase()
    const { data: { session } } = await supabase.auth.getSession()
    const insertData = toInsert(payload) as Record<string, unknown>
    if (session?.user?.id) {
      insertData.user_id = session.user.id
    }
    const { data, error } = await supabase
      .from('todo')
      .insert(insertData)
      .select('id,title,description,created_at')
      .single()
    if (error) return fail<Todo>({} as Todo, error.message, Number(error.code) || 500)
    // Stash the chosen priority as an in-memory override (not in DB).
    if (payload.priority && payload.priority !== 'medium') {
      const overrides = loadOverrides()
      overrides[data.id] = { priority: payload.priority }
      saveOverrides(overrides)
    }
    return ok(toTodo(data as TodoRow, loadOverrides()), '待办已创建')
  },

  async update(id: string, payload: TodoUpdatePayload): Promise<ApiResponse<Todo>> {
    const supabase = getSupabase()
    // Only title/description are persisted; completed/priority are overrides.
    const patch: Record<string, unknown> = {}
    if (payload.title !== undefined) patch.title = payload.title.trim()
    if (payload.description !== undefined)
      patch.description = payload.description.trim() || null

    if (payload.completed !== undefined || payload.priority !== undefined) {
      const overrides = loadOverrides()
      const ov = overrides[id] ?? {}
      if (payload.completed !== undefined) ov.completed = payload.completed
      if (payload.priority !== undefined) ov.priority = payload.priority
      overrides[id] = ov
      saveOverrides(overrides)
    }

    if (Object.keys(patch).length > 0) {
      const { data, error } = await supabase
        .from('todo')
        .update(patch)
        .eq('id', id)
        .select('id,title,description,created_at')
        .single()
      if (error) return fail<Todo>({} as Todo, error.message, Number(error.code) || 500)
      return ok(toTodo(data as TodoRow, loadOverrides()), '待办已更新')
    }

    // No DB columns to change — return the merged view from overrides.
    const { data } = await supabase
      .from('todo')
      .select('id,title,description,created_at')
      .eq('id', id)
      .single()
    if (!data) return fail<Todo>({} as Todo, '待办不存在', 404)
    return ok(toTodo(data as TodoRow, loadOverrides()), '待办已更新')
  },

  async remove(id: string): Promise<ApiResponse<{ id: string }>> {
    const supabase = getSupabase()
    const { error } = await supabase.from('todo').delete().eq('id', id)
    if (error) return fail({ id }, error.message, Number(error.code) || 500)
    // Clean up overrides for the deleted id.
    const overrides = loadOverrides()
    delete overrides[id]
    saveOverrides(overrides)
    return ok({ id }, '待办已删除')
  },

  toggle(id: string, completed: boolean): Promise<ApiResponse<Todo>> {
    return this.update(id, { completed })
  },

  async batch(payload: TodoBatchPayload): Promise<ApiResponse<Todo[]>> {
    // completed is an override, not a DB column — just flip each in storage.
    const overrides = loadOverrides()
    payload.ids.forEach((id) => {
      const ov = overrides[id] ?? {}
      ov.completed = payload.completed
      overrides[id] = ov
    })
    saveOverrides(overrides)
    // Re-read the affected rows to return the merged view.
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('todo')
      .select('id,title,description,created_at')
      .in('id', payload.ids)
    if (error) return fail<Todo[]>([], error.message, Number(error.code) || 500)
    return ok((data as TodoRow[]).map((r) => toTodo(r, loadOverrides())), '批量操作完成')
  }
}
