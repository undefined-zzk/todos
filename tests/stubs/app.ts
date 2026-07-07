// Minimal stub of Nuxt's `#app` for Vitest.
// Provides useState/useNuxtApp/defineNuxtPlugin plus an in-memory
// `$supabase` fake so the Supabase-backed services can be exercised
// without a real backend. The fake implements only the methods the
// services actually call: from().select/insert/update/delete/in/eq/order,
// .single(), auth.signInWithPassword/signInWithOAuth/signOut/getUser.
import { ref } from 'vue'
import type { Ref } from 'vue'
import { vi } from 'vitest'

const store: Record<string, Ref<unknown>> = {}

export function useState<T>(key: string, init: () => T): Ref<T> {
  if (!store[key]) {
    store[key] = ref(init()) as Ref<T>
  }
  return store[key] as Ref<T>
}

// ---------- In-memory Supabase fake ----------
// Mirrors the real `public.todo` table shape: (id, title, description, created_at).
interface TodoRow {
  id: string
  title: string
  description: string | null
  created_at: string
}

const todosTable: TodoRow[] = []
let authUser: {
  id: string
  email?: string
  user_metadata?: Record<string, unknown>
  app_metadata?: Record<string, unknown>
} | null = null
let idCounter = 0

function uid() {
  idCounter += 1
  return `row-${idCounter}`
}

// A single chainable builder covering select / insert / update / delete.
// `await` resolves it to { data, error }.
class TableBuilder {
  private op: 'select' | 'insert' | 'update' | 'delete' = 'select'
  private insertPayload: Partial<TodoRow> = {}
  private updatePatch: Record<string, unknown> = {}
  private filters: ((r: TodoRow) => boolean)[] = []
  private singleMode = false
  private orderField: keyof TodoRow | null = null
  private orderAsc = true
  // Whether the result of insert/update should be returned (`.select()`).
  private returnRows = false

  select() {
    // For insert/update, .select() means "return the affected rows".
    // For a plain select query, op stays 'select' and returnRows is true.
    if (this.op === 'insert' || this.op === 'update' || this.op === 'delete') {
      this.returnRows = true
    } else {
      this.op = 'select'
      this.returnRows = true
    }
    return this
  }
  insert(payload: Partial<TodoRow>) {
    this.op = 'insert'
    this.insertPayload = payload
    return this
  }
  update(patch: Record<string, unknown>) {
    this.op = 'update'
    this.updatePatch = patch
    return this
  }
  delete() {
    this.op = 'delete'
    return this
  }
  eq(col: keyof TodoRow, value: unknown) {
    this.filters.push((r) => r[col] === value)
    return this
  }
  in(col: keyof TodoRow, values: unknown[]) {
    this.filters.push((r) => values.includes(r[col]))
    return this
  }
  order(field: keyof TodoRow, opts?: { ascending?: boolean }) {
    this.orderField = field
    this.orderAsc = opts?.ascending ?? true
    return this
  }
  single() {
    this.singleMode = true
    return this
  }

  private filtered(): TodoRow[] {
    return todosTable.filter((r) => this.filters.every((f) => f(r)))
  }

  // Make the builder thenable so `await builder` works like supabase-js.
  then<TResult>(
    resolve: (v: { data: unknown; error: null }) => TResult,
    _reject?: (e: unknown) => TResult
  ): TResult | Promise<TResult> {
    let data: unknown
    if (this.op === 'insert') {
      const row: TodoRow = {
        id: uid(),
        title: this.insertPayload.title ?? '',
        description: this.insertPayload.description ?? null,
        created_at: new Date().toISOString()
      }
      todosTable.push(row)
      data = this.returnRows ? (this.singleMode ? row : [row]) : null
    } else if (this.op === 'update') {
      const updated: TodoRow[] = []
      for (const r of todosTable) {
        if (this.filters.every((f) => f(r))) {
          Object.assign(r, this.updatePatch)
          updated.push(r)
        }
      }
      data = this.returnRows ? (this.singleMode ? (updated[0] ?? null) : updated) : null
    } else if (this.op === 'delete') {
      for (let i = todosTable.length - 1; i >= 0; i--) {
        if (this.filters.every((f) => f(todosTable[i]!))) {
          todosTable.splice(i, 1)
        }
      }
      data = null
    } else {
      // select
      let result = this.filtered()
      if (this.orderField) {
        const f = this.orderField
        result = [...result].sort((a, b) => {
          const av = a[f] as unknown as number
          const bv = b[f] as unknown as number
          return this.orderAsc ? av - bv : bv - av
        })
      }
      data = this.singleMode ? (result[0] ?? null) : result
    }
    return Promise.resolve().then(() => resolve({ data, error: null }))
  }
}

function from(table: string) {
  if (table === 'todo' || table === 'todos') return new TableBuilder()
  throw new Error(`fake supabase: unknown table ${table}`)
}

const auth = {
  signInWithPassword: vi.fn(async (creds: { email: string; password: string }) => {
    authUser = {
      id: uid(),
      email: creds.email,
      app_metadata: { provider: 'local' }
    }
    return { data: { user: authUser }, error: null }
  }),
  signUp: vi.fn(async (creds: { email: string; password: string; options?: { data?: Record<string, unknown> } }) => {
    authUser = {
      id: uid(),
      email: creds.email,
      user_metadata: creds.options?.data ?? {},
      app_metadata: { provider: 'local' }
    }
    // Simulate Supabase's "auto-login after signUp" behaviour.
    return { data: { user: authUser, session: { user: authUser } }, error: null }
  }),
  signInWithOAuth: vi.fn(async () => ({ data: { url: 'https://provider' }, error: null })),
  signOut: vi.fn(async () => ({ error: null })),
  getUser: vi.fn(async () => ({
    data: { user: authUser }
  })),
  getSession: vi.fn(async () => ({
    data: { session: authUser ? { user: authUser, access_token: 'fake-token' } : null }
  })),
  onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: () => {} } } }))
}

const supabaseFake = { from, auth }

export function useNuxtApp() {
  return {
    $anime: {
      animate: () => ({ complete() {}, pause() {}, play() {} }),
      createTimeline: () => ({ add: () => {}, play: () => {} }),
      stagger: (base: number) => base,
      utils: { random: () => 0 },
      eases: {}
    },
    $supabase: supabaseFake
  }
}

export function defineNuxtPlugin(fn: unknown) {
  return fn
}

// Reset between tests (called from tests/setup.ts afterEach).
export function __resetState() {
  for (const k of Object.keys(store)) delete store[k]
  todosTable.length = 0
  authUser = null
  idCounter = 0
  auth.signInWithPassword.mockClear()
  auth.signUp.mockClear()
  auth.signInWithOAuth.mockClear()
  auth.signOut.mockClear()
  auth.getUser.mockClear()
  auth.getSession.mockClear()
}
