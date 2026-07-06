// Auth state management.
//
// Drives the login module: tracks the current user, loading and error
// states. Every action delegates to authService so the request framework
// is used end-to-end; swapping in a real backend changes nothing here.
import { useState } from '#app'
import { computed } from 'vue'
import type { AuthProvider, LoginCredentials, RegisterCredentials, SocialLoginPayload, User } from '~/types'
import { authService } from '~/services/auth.service'
import { storage } from '~/utils/storage'

const USER_KEY = 'user'

export function useAuth() {
  const user = useState<User | null>('auth:user', () => null)
  const loading = useState<boolean>('auth:loading', () => false)
  const error = useState<string | null>('auth:error', () => null)
  const pendingProvider = useState<AuthProvider | null>('auth:pendingProvider', () => null)

  const isAuthenticated = computed(() => user.value !== null)

  // Hydrate the current user from the Supabase session and subscribe to
  // auth state changes so OAuth redirects / sign-outs stay in sync.
  async function init() {
    try {
      const res = await authService.me()
      if (res.success) {
        user.value = res.data
        if (res.data) storage.set(USER_KEY, res.data)
        else storage.remove(USER_KEY)
      }
    } catch {
      // stay signed-out
    }

    const supabase = useNuxtApp().$supabase
    supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        user.value = {
          id: session.user.id,
          email: session.user.email ?? '',
          name:
            (session.user.user_metadata?.full_name as string) ??
            (session.user.user_metadata?.name as string) ??
            (session.user.email?.split('@')[0] ?? '用户'),
          avatar: session.user.user_metadata?.avatar_url as string | undefined,
          provider:
            (session.user.app_metadata?.provider as AuthProvider) ?? 'local'
        }
      } else {
        user.value = null
        storage.remove(USER_KEY)
      }
    })
  }

  async function login(credentials: LoginCredentials) {
    loading.value = true
    error.value = null
    pendingProvider.value = 'local'
    try {
      const res = await authService.login(credentials)
      if (res.success) {
        user.value = res.data
        storage.set(USER_KEY, res.data)
        return res.data
      }
      // Friendlier Chinese messages for common Supabase auth errors.
      const msg = res.message ?? ''
      if (/invalid credentials/i.test(msg)) {
        error.value = '邮箱或密码错误,或该账号尚未通过邮箱确认。请检查凭据,或注册一个新账号。'
      } else if (/email not confirmed/i.test(msg)) {
        error.value = '该账号尚未确认邮箱,请前往邮箱点击确认链接,或在 Supabase Dashboard 手动确认用户。'
      } else {
        error.value = msg || '登录失败'
      }
      return null
    } catch (e) {
      error.value = (e as { message?: string })?.message ?? '登录失败'
      return null
    } finally {
      loading.value = false
      pendingProvider.value = null
    }
  }

  async function register(credentials: RegisterCredentials) {
    loading.value = true
    error.value = null
    pendingProvider.value = 'local'
    try {
      const res = await authService.register(credentials)
      if (res.success) {
        // Auto-logged in after signUp.
        user.value = res.data
        storage.set(USER_KEY, res.data)
        return res.data
      }
      // Either an error, or "registered but email confirmation required".
      // In both cases surface a friendly message and stay signed-out.
      const msg = res.message ?? ''
      if (/user already exists|already registered/i.test(msg)) {
        error.value = '该邮箱已注册,请直接登录,或换一个邮箱注册。'
      } else if (/weak password/i.test(msg)) {
        error.value = '密码强度不足,请使用至少 6 位且包含字母与数字的密码。'
      } else {
        error.value = msg || '注册失败'
      }
      return null
    } catch (e) {
      error.value = (e as { message?: string })?.message ?? '注册失败'
      return null
    } finally {
      loading.value = false
      pendingProvider.value = null
    }
  }

  async function loginWithProvider(payload: SocialLoginPayload) {
    loading.value = true
    error.value = null
    pendingProvider.value = payload.provider
    try {
      const res = await authService.loginWithProvider(payload)
      if (res.success) {
        // OAuth flow redirects to the provider; the user is hydrated by
        // onAuthStateChange after the redirect returns. Don't set the
        // placeholder user here.
        return res.data
      }
      // Friendlier message for the common "provider not enabled" case.
      const msg = res.message ?? ''
      if (/not enabled|unsupported provider/i.test(msg)) {
        error.value = 'GitHub 登录未启用,请在 Supabase Dashboard > Authentication > Providers 中配置并启用 GitHub。'
      } else {
        error.value = msg || '第三方登录失败'
      }
      return null
    } catch (e) {
      error.value = (e as { message?: string })?.message ?? '第三方登录失败'
      return null
    } finally {
      loading.value = false
      pendingProvider.value = null
    }
  }

  async function logout() {
    loading.value = true
    try {
      await authService.logout()
    } finally {
      user.value = null
      storage.remove(USER_KEY)
      loading.value = false
    }
  }

  function clearError() {
    error.value = null
  }

  return {
    user,
    loading,
    error,
    pendingProvider,
    isAuthenticated,
    init,
    login,
    register,
    loginWithProvider,
    logout,
    clearError
  }
}
