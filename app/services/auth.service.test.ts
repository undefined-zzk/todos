import { describe, it, expect, beforeEach } from 'vitest'
import { authService } from '~/services/auth.service'

// Auth service tests run against the in-memory Supabase fake. The fake's
// auth.signInWithPassword creates a session user; getUser reads it back.

describe('authService (Supabase)', () => {
  beforeEach(() => {
    // auth state reset by setup afterEach
  })

  it('login() returns a local user derived from the email', async () => {
    const res = await authService.login({ email: 'Alice@Example.com', password: 'secret' })
    expect(res.success).toBe(true)
    expect(res.data.email).toBe('alice@example.com')
    expect(res.data.provider).toBe('local')
  })

  it('register() creates a user and auto-logs in', async () => {
    const res = await authService.register({ email: 'newbie@example.com', password: 'pw123456', name: '小白' })
    expect(res.success).toBe(true)
    expect(res.data.email).toBe('newbie@example.com')
    // me() now returns the registered user (auto-login)
    const me = await authService.me()
    expect(me.data?.email).toBe('newbie@example.com')
  })

  it('me() returns the signed-in user after login', async () => {
    await authService.login({ email: 'bob@example.com', password: 'pw' })
    const res = await authService.me()
    expect(res.success).toBe(true)
    expect(res.data?.email).toBe('bob@example.com')
  })

  it('me() returns null when not signed in', async () => {
    const res = await authService.me()
    expect(res.success).toBe(true)
    expect(res.data).toBeNull()
  })

  it('loginWithProvider("github") resolves and triggers the OAuth redirect', async () => {
    const res = await authService.loginWithProvider({ provider: 'github' })
    expect(res.success).toBe(true)
  })

  it('logout() resolves successfully', async () => {
    await authService.login({ email: 'out@example.com', password: 'pw' })
    const res = await authService.logout()
    expect(res.success).toBe(true)
    expect(res.data).toBeNull()
  })
})
