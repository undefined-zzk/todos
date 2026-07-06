import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  define: {
    'import.meta.client': true,
    'import.meta.server': false
  },
  test: {
    environment: 'happy-dom',
    globals: true,
    include: ['app/**/*.test.ts', 'tests/**/*.test.ts'],
    setupFiles: ['./tests/setup.ts']
  },
  resolve: {
    alias: {
      '~': fileURLToPath(new URL('./app', import.meta.url)),
      '~~': fileURLToPath(new URL('.', import.meta.url)),
      '#app': fileURLToPath(new URL('./tests/stubs/app.ts', import.meta.url)),
      '#imports': fileURLToPath(new URL('./tests/stubs/app.ts', import.meta.url))
    }
  }
})
