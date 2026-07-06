// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  // Expose Supabase credentials to the client. Values come from
  // .env.local (gitignored) via process.env.
  runtimeConfig: {
    public: {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseKey: process.env.SUPABASE_KEY
    }
  },

  // Auto-import the services directory so service modules (todo.service,
  // auth.service) are available app-wide without manual imports, matching
  // the behaviour of composables/ and utils/.
  imports: {
    dirs: ['app/services']
  },

  // Use filename-based component names so e.g. components/todos/TodoInput.vue
  // is available as <TodoInput /> instead of <TodosTodoInput />.
  components: [{ path: '~/components', pathPrefix: false }],

  // Global stylesheet
  css: ['~/assets/css/main.css'],

  app: {
    head: {
      title: 'Todos · 待办事项',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: '基于 Nuxt 与 animejs 的待办事项应用' }
      ]
    }
  }
})
