export default defineNuxtRouteMiddleware(async (to) => {
  if (!import.meta.client) return
  if (to.path === '/login') return

  const supabase = useNuxtApp().$supabase
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return navigateTo('/login')
  }
})
