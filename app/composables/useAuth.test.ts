import { describe, it, expect, beforeEach } from 'vitest'
import { useAuth } from '~/composables/useAuth'

function fresh() {
  return useAuth()
}

describe('useAuth composable', () => {
  beforeEach(() => {
    // state cleared by setup afterEach
  })

  it('starts unauthenticated with no error', () => {
    const a = fresh()
    expect(a.user.value).toBeNull()
    expect(a.isAuthenticated.value).toBe(false)
    expect(a.error.value).toBeNull()
    expect(a.loading.value).toBe(false)
    expect(a.pendingProvider.value).toBeNull()
  })

  it('login() with valid credentials authenticates the user', async () => {
    const a = fresh()
    const user = await a.login({ email: 'Ada@Example.com', password: 'secret123' })
    expect(user).not.toBeNull()
    expect(a.isAuthenticated.value).toBe(true)
    expect(a.user.value?.email).toBe('ada@example.com')
    expect(a.pendingProvider.value).toBeNull()
    expect(a.loading.value).toBe(false)
  })

  it('login() sets pendingProvider to "local" during the request', async () => {
    const a = fresh()
    const p = a.login({ email: 'x@example.com', password: 'password' })
    expect(a.pendingProvider.value).toBe('local')
    await p
    expect(a.pendingProvider.value).toBeNull()
    expect(a.loading.value).toBe(false)
  })

  it('register() authenticates the user on success', async () => {
    const a = fresh()
    const user = await a.register({ email: 'new@example.com', password: 'pw123456', name: '新人' })
    expect(user).not.toBeNull()
    expect(a.isAuthenticated.value).toBe(true)
    expect(a.user.value?.email).toBe('new@example.com')
  })

  it('loginWithProvider() sets pendingProvider during the request', async () => {
    const a = fresh()
    const p = a.loginWithProvider({ provider: 'github' })
    expect(a.pendingProvider.value).toBe('github')
    await p
    // OAuth redirects; user hydration is handled by onAuthStateChange.
    expect(a.pendingProvider.value).toBeNull()
    expect(a.loading.value).toBe(false)
  })

  it('clearError() wipes the error state', () => {
    const a = fresh()
    a.clearError()
    expect(a.error.value).toBeNull()
  })

  it('logout() clears the user', async () => {
    const a = fresh()
    await a.login({ email: 'out@example.com', password: 'pw123456' })
    expect(a.isAuthenticated.value).toBe(true)
    await a.logout()
    expect(a.user.value).toBeNull()
    expect(a.isAuthenticated.value).toBe(false)
  })
})
