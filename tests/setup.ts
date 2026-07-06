// Vitest setup: provide Nuxt auto-import globals that composables and
// components rely on at runtime. The `#app`/`#imports` aliases point to
// tests/stubs/app.ts which provides useState/useNuxtApp/defineNuxtPlugin.
import { vi, beforeAll, afterEach } from 'vitest'
import {
  computed,
  ref,
  reactive,
  readonly,
  nextTick,
  watch,
  onMounted,
  onBeforeUnmount,
  onBeforeMount,
  onUnmounted
} from 'vue'
import { __resetState } from './stubs/app'
import { useTodos } from '~/composables/useTodos'
import { useAuth } from '~/composables/useAuth'
import { useAnime } from '~/composables/useAnime'
import { useNuxtApp as stubUseNuxtApp } from './stubs/app'

function useRuntimeConfig() {
  return { public: {}, app: { baseURL: '/' } }
}

function useHead() {}

function navigateTo() {
  return Promise.resolve()
}

function definePageMeta() {}

beforeAll(() => {
  const g = globalThis as Record<string, unknown>
  // Vue reactivity globals (used by components that rely on auto-imports).
  g.ref = ref
  g.reactive = reactive
  g.readonly = readonly
  g.computed = computed
  g.watch = watch
  g.nextTick = nextTick
  // Vue lifecycle hooks (auto-imported by Nuxt from 'vue').
  g.onMounted = onMounted
  g.onBeforeMount = onBeforeMount
  g.onBeforeUnmount = onBeforeUnmount
  g.onUnmounted = onUnmounted
  // Nuxt runtime auto-imports not covered by the #app stub.
  g.useRuntimeConfig = useRuntimeConfig
  g.useNuxtApp = stubUseNuxtApp
  g.useHead = useHead
  g.navigateTo = navigateTo
  g.definePageMeta = definePageMeta
  // Composables auto-imported by Nuxt from the composables/ dir.
  g.useTodos = useTodos
  g.useAuth = useAuth
  g.useAnime = useAnime
})

afterEach(() => {
  // Wipe the #app stub's useState store between tests.
  __resetState()
  try {
    window.localStorage.clear()
  } catch {
    // ignore
  }
  vi.clearAllMocks()
})
