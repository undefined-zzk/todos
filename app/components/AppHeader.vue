<template>
  <header class="header">
    <div class="app-container header__inner">
      <NuxtLink to="/" class="header__brand" ref="brandRef">
        <span class="header__logo" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
            <path d="M4 12.5l5 5 11-11" stroke="currentColor" stroke-width="2.4"
              stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </span>
        <span class="header__title">Todos</span>
      </NuxtLink>

      <div class="header__actions">
        <template v-if="isAuthenticated && user">
          <span class="header__user" :title="user.email">{{ user.name }}</span>
          <button class="btn btn--ghost" @click="onLogout" :disabled="loading">
            退出
          </button>
        </template>
        <template v-else>
          <NuxtLink to="/login" class="btn btn--primary">登录</NuxtLink>
        </template>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
// Top navigation bar. Shows the brand on the left and auth state on the right.
const { user, isAuthenticated, loading, logout } = useAuth()
const { enterElement } = useAnime()
const brandRef = ref<HTMLElement | null>(null)

onMounted(() => {
  if (brandRef.value) enterElement(brandRef.value, 80)
})

async function onLogout() {
  await logout()
  await navigateTo('/login')
}
</script>

<style scoped>
.header {
  position: sticky;
  top: 0;
  z-index: 20;
  background: color-mix(in srgb, var(--bg-elevated) 85%, transparent);
  backdrop-filter: saturate(180%) blur(12px);
  border-bottom: 1px solid var(--border);
}
.header__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
}
.header__brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: var(--text);
}
.header__logo {
  display: inline-grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--primary), #8a6bff);
  color: #fff;
  box-shadow: var(--shadow-sm);
}
.header__title {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.2px;
}
.header__actions {
  display: inline-flex;
  align-items: center;
  gap: 12px;
}
.header__user {
  font-size: 14px;
  color: var(--text-muted);
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 640px) {
  .header__inner { height: 56px; }
  .header__title { font-size: 16px; }
  .header__user { display: none; }
}
@media (max-width: 480px) {
  .header__inner { height: 50px; }
  .header__logo { width: 28px; height: 28px; border-radius: 8px; }
  .header__title { font-size: 15px; }
  .btn { height: 34px; padding: 0 12px; font-size: 13px; }
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 38px;
  padding: 0 16px;
  border-radius: var(--radius-sm);
  font-size: 14px;
  font-weight: 600;
  border: 1px solid transparent;
  transition: background-color 0.18s ease, color 0.18s ease,
    border-color 0.18s ease, transform 0.18s ease, opacity 0.18s ease;
}
.btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.btn--primary {
  background: var(--primary);
  color: #fff;
}
.btn--primary:hover:not(:disabled) {
  background: var(--primary-hover);
}
.btn--ghost {
  background: transparent;
  color: var(--text-muted);
  border-color: var(--border);
}
.btn--ghost:hover:not(:disabled) {
  color: var(--text);
  border-color: var(--border-strong);
}
</style>
