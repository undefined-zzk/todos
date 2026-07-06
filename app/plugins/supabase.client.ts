// Supabase client plugin.
//
// Creates a single Supabase client from the public runtimeConfig values
// (SUPABASE_URL / SUPABASE_KEY from .env.local) and provides it app-wide
// via `useNuxtApp().$supabase`. The service layer uses this client to
// perform real database + auth operations.
import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const url = config.public.supabaseUrl as string
  const key = config.public.supabaseKey as string

  if (!url || !key) {
    const msg =
      '[supabase] Missing SUPABASE_URL / SUPABASE_KEY. ' +
      'Put them in .env (Nuxt loads .env, not .env.local by default) and restart `nuxt dev`.'
    console.error(msg)
    throw new Error(msg)
  }

  const supabase = createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  })

  return {
    provide: {
      supabase
    }
  }
})

declare module '#app' {
  interface NuxtApp {
    $supabase: SupabaseClient
  }
}
