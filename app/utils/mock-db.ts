// In-memory mock database.
//
// This simulates a backend persistence layer so the front-end is fully
// interactive. When a real backend is connected, the service modules
// swap `withMock(...)` for a real `request(...)` call and this file can
// be removed entirely.
import type { Todo, User } from '~/types'

function uid(prefix = 'id'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`
}

const now = Date.now()

const todos: Todo[] = [
  {
    id: uid('todo'),
    title: '体验 animejs 入场动画',
    description: '在首页观察元素逐个淡入的缓动效果',
    completed: false,
    priority: 'medium',
    createdAt: now - 1000 * 60 * 60 * 5,
    updatedAt: now - 1000 * 60 * 60 * 5
  },
  {
    id: uid('todo'),
    title: '完成待办事项核心功能',
    description: '新增 / 编辑 / 删除 / 标记完成 / 筛选 / 批量操作',
    completed: false,
    priority: 'high',
    createdAt: now - 1000 * 60 * 60 * 3,
    updatedAt: now - 1000 * 60 * 60 * 3
  },
  {
    id: uid('todo'),
    title: '搭建多渠道登录页面',
    description: '邮箱密码 + GitHub 两种登录入口',
    completed: true,
    priority: 'low',
    createdAt: now - 1000 * 60 * 60 * 24,
    updatedAt: now - 1000 * 60 * 30
  }
]

const users: Record<string, User> = {}

export const mockDb = {
  uid,
  todos: {
    list: () => [...todos],
    find: (id: string) => todos.find(t => t.id === id),
    insert: (todo: Todo) => {
      todos.unshift(todo)
      return todo
    },
    update: (id: string, patch: Partial<Todo>): Todo | null => {
      const idx = todos.findIndex(t => t.id === id)
      if (idx === -1) return null
      const existing = todos[idx]!
      const updated: Todo = { ...existing, ...patch, updatedAt: Date.now() }
      todos[idx] = updated
      return updated
    },
    remove: (id: string) => {
      const idx = todos.findIndex(t => t.id === id)
      if (idx === -1) return false
      todos.splice(idx, 1)
      return true
    },
    batchUpdate: (ids: string[], completed: boolean) => {
      ids.forEach(id => {
        const t = todos.find(item => item.id === id)
        if (t) {
          t.completed = completed
          t.updatedAt = Date.now()
        }
      })
      return todos.filter(t => ids.includes(t.id))
    }
  },
  users: {
    all: () => Object.values(users),
    findByEmail: (email: string) =>
      Object.values(users).find(u => u.email === email) ?? null,
    upsert: (user: User) => {
      users[user.id] = user
      return user
    }
  }
}
