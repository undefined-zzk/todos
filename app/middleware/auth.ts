export default defineNuxtRouteMiddleware(async (to) => {
  if (!import.meta.client) return

  // Skip auth check on initial page load to prevent hydration mismatch.
  // Auth is handled in the layout's onMounted after hydration completes.
  if (window.location.pathname === to.path) {
    return
  }

  const supabase = useNuxtApp().$supabase
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return navigateTo('/login')
  }
})