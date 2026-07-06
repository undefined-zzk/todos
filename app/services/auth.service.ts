// Auth service: real Supabase Auth implementation.
//
// - Email/password uses supabase.auth.signInWithPassword.
// - GitHub uses supabase.auth.signInWithOAuth which redirects to the
//   provider; after the redirect the session is restored automatically.
// - me() reads the current session user.
// - logout() signs out.
//
// The User domain shape is preserved so useAuth and the header stay the same.
import type {
  ApiResponse,
  AuthProvider,
  LoginCredentials,
  RegisterCredentials,
  SocialLoginPayload,
  User
} from '~/types'

function ok<T>(data: T, message = 'success'): ApiResponse<T> {
  return { data, success: true, message }
}

function fail<T>(data: T, message: string, code?: number): ApiResponse<T> {
  return { data, success: false, message, code }
}

function mapUser(supabaseUser: {
  id: string
  email?: string
  user_metadata?: Record<string, unknown>
  app_metadata?: Record<string, unknown>
}): User {
  const meta = supabaseUser.user_metadata ?? {}
  const provider = (supabaseUser.app_metadata?.provider as AuthProvider) ?? 'local'
  const name =
    (meta.full_name as string) ??
    (meta.name as string) ??
    (meta.user_name as string) ??
    (supabaseUser.email?.split('@')[0] ?? '用户')
  return {
    id: supabaseUser.id,
    email: supabaseUser.email ?? '',
    name,
    avatar: meta.avatar_url as string | undefined,
    provider
  }
}

function getSupabase() {
  return useNuxtApp().$supabase
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<ApiResponse<User>> {
    const supabase = getSupabase()
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email.trim().toLowerCase(),
      password: credentials.password
    })
    if (error)
      return fail<User>({} as User, error.message, Number(error.status) || 500)
    return ok(mapUser(data.user), '登录成功')
  },

  async register(credentials: RegisterCredentials): Promise<ApiResponse<User>> {
    const supabase = getSupabase()
    const { data, error } = await supabase.auth.signUp({
      email: credentials.email.trim().toLowerCase(),
      password: credentials.password,
      options: {
        data: credentials.name ? { full_name: credentials.name } : undefined
      }
    })
    if (error)
      return fail<User>({} as User, error.message, Number(error.status) || 500)
    // signUp may return a session (auto-login) or just a user (email
    // confirmation required). Handle both.
    if (data.session && data.user) {
      return ok(mapUser(data.user), '注册成功,已自动登录')
    }
    if (data.user) {
      return fail<User>(
        mapUser(data.user),
        '注册成功,请前往邮箱点击确认链接后即可登录',
        200
      )
    }
    return fail<User>({} as User, '注册未完成,请稍后重试')
  },

  async loginWithProvider(
    payload: SocialLoginPayload
  ): Promise<ApiResponse<User>> {
    const supabase = getSupabase()
    // signInWithOAuth redirects the browser to the provider. After the
    // redirect, the supabase client restores the session and our
    // auth.init() (called on mount) hydrates the user.
    const { error } = await supabase.auth.signInWithOAuth({
      provider: payload.provider,
      options: {
        redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined
      }
    })
    if (error)
      return fail<User>({} as User, error.message, Number(error.status) || 500)
    // No user is available synchronously; the redirect will reload the app.
    return ok({} as User, `${payload.provider} 登录跳转中`)
  },

  async logout(): Promise<ApiResponse<null>> {
    const supabase = getSupabase()
    const { error } = await supabase.auth.signOut()
    if (error) return fail(null, error.message, Number(error.status) || 500)
    return ok(null, '已退出登录')
  },

  async me(): Promise<ApiResponse<User | null>> {
    const supabase = getSupabase()
    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) return ok(null)
    return ok(mapUser(user))
  }
}
