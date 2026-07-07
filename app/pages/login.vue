<template>
  <div class="login-page">
    <div class="login-page__card" ref="cardRef">
      <div class="login-page__brand">
        <span class="login-page__logo" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="26" height="26" fill="none">
            <path d="M4 12.5l5 5 11-11" stroke="currentColor" stroke-width="2.4"
              stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </span>
        <h1 class="login-page__title">欢迎回来</h1>
        <p class="login-page__subtitle">登录以同步你的待办事项</p>
      </div>

      <Transition name="auth-error">
        <div v-if="authError" class="login-page__alert">
          <span class="login-page__alert-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" />
              <path d="M12 8v5M12 16.5v.5" stroke="currentColor" stroke-width="2"
                stroke-linecap="round" />
            </svg>
          </span>
          <span>{{ authError }}</span>
          <button class="login-page__alert-close" @click="clearError" aria-label="关闭">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.4"
                stroke-linecap="round" />
            </svg>
          </button>
        </div>
      </Transition>

      <LoginForm @success="onSuccess" />

      <LoginDivider />

      <SocialLoginButtons @success="onSuccess" />
    </div>
  </div>
</template>

<script setup lang="ts">
// Login page: composes the brand header, email/password form, divider and
// social buttons. Plays an animejs entrance on mount. On a successful
// login (local or OAuth), redirects to the home page.
const { enterElement, shake } = useAnime()
const { error: authError, clearError, isAuthenticated } = useAuth()
const cardRef = ref<HTMLElement | null>(null)
const alertRef = ref<HTMLElement | null>(null)

function onSuccess() {
  navigateTo('/')
}

watch(authError, (v) => {
  if (v && alertRef.value) shake(alertRef.value)
})

watch(isAuthenticated, (val) => {
  if (val) {
    navigateTo('/')
  }
}, { immediate: true })

onMounted(() => {
  if (cardRef.value) {
    enterElement(cardRef.value, 100)
  }
})

useHead({ title: '登录 · Todos' })
</script>

<style scoped>
.login-page {
  flex: 1;
  display: grid;
  place-items: center;
  overflow: hidden;
}
.login-page__card {
  width: 100%;
  max-width: 400px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.login-page__brand {
  text-align: center;
  margin-bottom: 4px;
}
.login-page__logo {
  display: inline-grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: linear-gradient(135deg, var(--primary), #8a6bff);
  color: #fff;
  box-shadow: var(--shadow);
  margin-bottom: 14px;
}
.login-page__title {
  font-size: 22px;
  font-weight: 700;
}
.login-page__subtitle {
  margin-top: 6px;
  font-size: 14px;
  color: var(--text-muted);
}

.login-page__alert {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  border-radius: var(--radius-sm);
  background: var(--danger-soft);
  color: var(--danger);
  font-size: 13px;
  line-height: 1.45;
  border: 1px solid color-mix(in srgb, var(--danger) 25%, transparent);
}
.login-page__alert-icon {
  flex: 0 0 auto;
  margin-top: 1px;
}
.login-page__alert-close {
  flex: 0 0 auto;
  display: inline-grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border-radius: 6px;
  color: inherit;
  opacity: 0.6;
  transition: opacity 0.18s ease, background-color 0.18s ease;
}
.login-page__alert-close:hover {
  opacity: 1;
  background: color-mix(in srgb, var(--danger) 12%, transparent);
}

.auth-error-enter-active,
.auth-error-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.auth-error-enter-from,
.auth-error-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

@media (max-width: 640px) {
  .login-page__card { padding: 24px; gap: 16px; }
  .login-page__title { font-size: 20px; }
  .login-page__subtitle { font-size: 13px; }
  .login-page__logo { width: 42px; height: 42px; border-radius: 12px; }
}
@media (max-width: 480px) {
  .login-page__card { padding: 20px; gap: 14px; border-radius: 16px; }
  .login-page__title { font-size: 18px; }
  .login-page__subtitle { font-size: 12px; }
  .login-page__logo { width: 38px; height: 38px; border-radius: 10px; margin-bottom: 10px; }
}
</style>
