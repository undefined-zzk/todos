<template>
  <div class="app-container todos-page">
    <section class="todos-page__head" ref="headRef">
      <div>
        <h1 class="todos-page__title">我的待办</h1>
        <p class="todos-page__subtitle">
          {{ greeting }}{{ user ? `，${user.name}` : '' }} — 让今天更有条理
        </p>
      </div>
      <TodoFilter />
    </section>

    <section class="todos-page__stats" ref="statsRef">
      <TodoStats />
    </section>

    <section class="todos-page__input" ref="inputRef">
      <TodoInput />
    </section>

    <section class="todos-page__batch">
      <TodoBatchActions />
    </section>

    <section class="todos-page__list" ref="listWrapRef">
      <TodoList />
    </section>
  </div>
</template>

<script setup lang="ts">
// Todos home page. Composes the input, filter, stats, batch toolbar and
// list, then plays a staggered entrance animation on mount via animejs.
const { user } = useAuth()
const { init } = useTodos()
const { enterPage } = useAnime()

const headRef = ref<HTMLElement | null>(null)
const statsRef = ref<HTMLElement | null>(null)
const inputRef = ref<HTMLElement | null>(null)
const listWrapRef = ref<HTMLElement | null>(null)

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 6) return '夜深了'
  if (h < 12) return '早上好'
  if (h < 18) return '下午好'
  return '晚上好'
})

onMounted(() => {
  init()
  // Staggered entrance of the major page sections.
  enterPage([headRef.value, statsRef.value, inputRef.value, listWrapRef.value].filter(Boolean) as HTMLElement[])
})

definePageMeta({ middleware: 'auth' })

useHead({ title: 'Todos · 待办事项' })
</script>

<style scoped>
.todos-page {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.todos-page__head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.todos-page__title {
  font-size: 28px;
  font-weight: 700;
  letter-spacing: 0.2px;
}

.todos-page__subtitle {
  margin-top: 6px;
  font-size: 14px;
  color: var(--text-muted);
}

@media (max-width: 640px) {
  .todos-page {
    gap: 14px;
  }

  .todos-page__title {
    font-size: 22px;
  }

  .todos-page__subtitle {
    font-size: 13px;
  }
}

@media (max-width: 480px) {
  .todos-page {
    gap: 12px;
  }

  .todos-page__title {
    font-size: 20px;
  }

  .todos-page__subtitle {
    font-size: 12px;
  }

  .todos-page__head {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
}
</style>
