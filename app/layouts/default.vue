<template>
  <div class="layout">
    <AppHeader />
    <main class="layout__main">
      <slot />
    </main>
    <footer class="layout__footer">
      <span>Nuxt 4 · animejs 4 · 前后端分离演示</span>
    </footer>
  </div>
</template>

<script setup lang="ts">
// Default layout: header + page slot + footer.
// Initialises auth on client mount so every page knows the login state.
const { init } = useAuth()

onMounted(() => {
  init()
})
</script>

<style scoped>
.layout {
  min-height: 100%;
  display: flex;
  flex-direction: column;
}
.layout__main {
  flex: 1;
  padding: 32px 0 48px;
}
.layout__footer {
  padding: 24px 20px 32px;
  text-align: center;
  color: var(--text-subtle);
  font-size: 13px;
}
</style>
