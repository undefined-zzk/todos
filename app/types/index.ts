// Global type definitions for the Todos application.

// ---------- Todo domain ----------
export type TodoPriority = 'low' | 'medium' | 'high'

export interface Todo {
  id: string
  title: string
  description?: string
  completed: boolean
  priority: TodoPriority
  createdAt: number
  updatedAt: number
}

export type TodoFilterType = 'all' | 'active' | 'completed'

export interface TodoCreatePayload {
  title: string
  description?: string
  priority?: TodoPriority
}

export interface TodoUpdatePayload {
  title?: string
  description?: string
  completed?: boolean
  priority?: TodoPriority
}

export interface TodoBatchPayload {
  ids: string[]
  completed: boolean
}

// ---------- Auth domain ----------
export type AuthProvider = 'local' | 'github'

export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  provider: AuthProvider
}

export interface LoginCredentials {
  email: string
  password: string
  remember?: boolean
}

export interface RegisterCredentials {
  email: string
  password: string
  name?: string
}

export interface SocialLoginPayload {
  provider: Exclude<AuthProvider, 'local'>
}

// ---------- Generic API envelope ----------
export interface ApiResponse<T = unknown> {
  data: T
  success: boolean
  message?: string
  code?: number
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export interface ApiRequestConfig {
  method: HttpMethod
  url: string
  params?: Record<string, unknown>
  data?: unknown
  headers?: Record<string, string>
}

export interface RequestOptions {
  // Reserved hook executed right before the request is dispatched.
  // Replace the mock dispatcher with a real $fetch call in production.
  onRequest?: (config: ApiRequestConfig) => ApiRequestConfig
  // Reserved hook executed after a successful response.
  onResponse?: <T>(response: ApiResponse<T>) => void
  // Reserved hook executed when the request fails.
  onError?: (error: ApiError) => void
}

export interface ApiError {
  code: number | string
  message: string
  cause?: unknown
}
