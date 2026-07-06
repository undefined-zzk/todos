<template>
  <div class="social">
    <button
      v-for="p in providers"
      :key="p.id"
      type="button"
      class="social__btn"
      :class="[`social__btn--${p.id}`, { 'is-loading': pendingProvider === p.id }]"
      :disabled="loading"
      @click="onClick(p.id)"
    >
      <span v-if="pendingProvider === p.id" class="social__spinner" aria-hidden="true"></span>
      <span v-else class="social__icon" v-html="p.icon" aria-hidden="true"></span>
      <span class="social__label">{{ p.label }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import type { AuthProvider } from '~/types'

// GitHub social login button. Triggers useAuth.loginWithProvider, which
// routes through authService (Supabase OAuth redirect). Shows a spinner
// while the provider is pending.
const emit = defineEmits<{ (e: 'success'): void }>()

const { loginWithProvider, loading, pendingProvider } = useAuth()
const { pressFeedback } = useAnime()

const providers: {
  id: Exclude<AuthProvider, 'local'>
  label: string
  icon: string
}[] = [
  {
    id: 'github',
    label: '使用 GitHub 登录',
    icon: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.49 0-.24-.01-.87-.01-1.71-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.49-1.11-1.49-.91-.64.07-.62.07-.62 1 .07 1.53 1.05 1.53 1.05.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.36-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.27 2.75 1.05a9.4 9.4 0 0 1 5 0c1.91-1.32 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.93-2.34 4.79-4.57 5.05.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .27.18.6.69.49A10.02 10.02 0 0 0 22 12.25C22 6.58 17.52 2 12 2z"/></svg>'
  }
]

async function onClick(id: Exclude<AuthProvider, 'local'>) {
  pressFeedback(`.social__btn--${id}`)
  const user = await loginWithProvider({ provider: id })
  if (user) emit('success')
}
</script>

<style scoped>
.social {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.social__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  height: 46px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: var(--surface);
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
  transition: background-color 0.18s ease, border-color 0.18s ease, transform 0.18s ease, opacity 0.18s ease;
}
.social__btn:hover:not(:disabled) {
  border-color: var(--border-strong);
  background: var(--surface-2);
}
.social__btn:active:not(:disabled) { transform: scale(0.98); }
.social__btn:disabled { opacity: 0.6; cursor: not-allowed; }
.social__btn--github .social__icon { color: var(--text); }
.social__btn.is-loading { opacity: 0.8; }
.social__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
}
.social__spinner {
  width: 16px;
  height: 16px;
  border: 2px solid var(--border-strong);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: social-spin 0.7s linear infinite;
}
@keyframes social-spin { to { transform: rotate(360deg); } }
</style>
