<template>
  <form class="login-form" @submit.prevent="onSubmit" novalidate ref="rootRef">
    <div v-if="mode === 'register'" class="field" :class="{ 'has-error': errors.name }">
      <label class="field__label" for="login-name">昵称（可选）</label>
      <div class="field__control">
        <svg class="field__icon" viewBox="0 0 24 24" width="18" height="18" fill="none">
          <circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="2" />
          <path d="M4 20c0-4 4-6 8-6s8 2 8 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        </svg>
        <input
          id="login-name"
          v-model.trim="name"
          type="text"
          class="field__input"
          :class="{ 'is-invalid': errors.name }"
          placeholder="怎么称呼你"
          maxlength="30"
          autocomplete="name"
          @input="clearFieldError('name')"
        />
      </div>
      <p v-if="errors.name" class="field__error">{{ errors.name }}</p>
    </div>

    <div class="field" :class="{ 'has-error': errors.email }">
      <label class="field__label" for="login-email">邮箱</label>
      <div class="field__control">
        <svg class="field__icon" viewBox="0 0 24 24" width="18" height="18" fill="none">
          <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" stroke-width="2" />
          <path d="M4 7l8 6 8-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        <input
          id="login-email"
          v-model.trim="email"
          type="email"
          class="field__input"
          :class="{ 'is-invalid': errors.email }"
          placeholder="you@example.com"
          autocomplete="email"
          @input="clearFieldError('email')"
          ref="emailRef"
        />
      </div>
      <p v-if="errors.email" class="field__error" ref="emailErrRef">{{ errors.email }}</p>
    </div>

    <div class="field" :class="{ 'has-error': errors.password }">
      <label class="field__label" for="login-password">密码</label>
      <div class="field__control">
        <svg class="field__icon" viewBox="0 0 24 24" width="18" height="18" fill="none">
          <rect x="4" y="10" width="16" height="10" rx="2" stroke="currentColor" stroke-width="2" />
          <path d="M8 10V7a4 4 0 1 1 8 0v3" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        </svg>
        <input
          id="login-password"
          v-model="password"
          :type="showPassword ? 'text' : 'password'"
          class="field__input"
          :class="{ 'is-invalid': errors.password }"
          :placeholder="mode === 'register' ? '至少 6 位' : '请输入密码'"
          :autocomplete="mode === 'register' ? 'new-password' : 'current-password'"
          @input="clearFieldError('password')"
        />
        <button
          type="button"
          class="field__toggle"
          :title="showPassword ? '隐藏密码' : '显示密码'"
          @click="showPassword = !showPassword"
        >
          <svg v-if="showPassword" viewBox="0 0 24 24" width="18" height="18" fill="none">
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" stroke="currentColor" stroke-width="2" />
            <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2" />
          </svg>
          <svg v-else viewBox="0 0 24 24" width="18" height="18" fill="none">
            <path d="M3 3l18 18M10.6 10.6a3 3 0 0 0 4.2 4.2M9.9 5.2A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.3 4.3M6.2 6.2A17 17 0 0 0 2 12s3.5 7 10 7a10 10 0 0 0 3.7-.7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
      </div>
      <p v-if="errors.password" class="field__error" ref="passwordErrRef">{{ errors.password }}</p>
    </div>

    <div v-if="mode === 'login'" class="login-form__row">
      <label class="login-form__remember">
        <input v-model="remember" type="checkbox" />
        <span>记住我</span>
      </label>
      <a href="#" class="login-form__link" @click.prevent="onForgot">忘记密码？</a>
    </div>

    <button type="submit" class="login-form__submit" :disabled="loading">
      <span v-if="loading" class="spinner" aria-hidden="true"></span>
      <span>{{ submitLabel }}</span>
    </button>

    <p class="login-form__switch">
      {{ mode === 'login' ? '还没有账号?' : '已有账号?' }}
      <a href="#" @click.prevent="toggleMode">{{ mode === 'login' ? '立即注册' : '去登录' }}</a>
    </p>
  </form>
</template>

<script setup lang="ts">
// Email/password form with a login/register toggle. In register mode an
// optional nickname field is shown. On success the parent is notified.
// Validation errors trigger a shake animation via useAnime.
const emit = defineEmits<{ (e: 'success'): void }>()

const { login, register, loading, error: authError, clearError } = useAuth()
const { shake, pressFeedback } = useAnime()

const rootRef = ref<HTMLElement | null>(null)
const emailRef = ref<HTMLInputElement | null>(null)
const emailErrRef = ref<HTMLElement | null>(null)
const passwordErrRef = ref<HTMLElement | null>(null)

const mode = ref<'login' | 'register'>('login')
const name = ref('')
const email = ref('')
const password = ref('')
const remember = ref(true)
const showPassword = ref(false)
const errors = reactive<{ name?: string; email?: string; password?: string }>({})

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const submitLabel = computed(() => {
  if (loading.value) return mode.value === 'register' ? '注册中…' : '登录中…'
  return mode.value === 'register' ? '注册' : '登录'
})

function toggleMode() {
  mode.value = mode.value === 'login' ? 'register' : 'login'
  errors.name = undefined
  errors.email = undefined
  errors.password = undefined
  if (authError.value) clearError()
  nextTick(() => emailRef.value?.focus())
}

function validate(): boolean {
  errors.name = undefined
  errors.email = undefined
  errors.password = undefined
  let valid = true
  if (mode.value === 'register' && name.value.length > 30) {
    errors.name = '昵称最多 30 个字符'
    valid = false
  }
  if (!email.value) {
    errors.email = '请输入邮箱'
    valid = false
  } else if (!EMAIL_RE.test(email.value)) {
    errors.email = '邮箱格式不正确'
    valid = false
  }
  if (!password.value) {
    errors.password = mode.value === 'register' ? '请输入密码' : '请输入密码'
    valid = false
  } else if (password.value.length < 6) {
    errors.password = '密码至少 6 位'
    valid = false
  }
  return valid
}

function clearFieldError(field: 'name' | 'email' | 'password') {
  errors[field] = undefined
  if (authError.value) clearError()
}

function onForgot() {
  // Reserved: route to password recovery flow.
}

async function onSubmit() {
  if (!validate()) {
    pressFeedback(rootRef.value)
    if (errors.email && emailErrRef.value) shake(emailErrRef.value)
    if (errors.password && passwordErrRef.value) shake(passwordErrRef.value)
    return
  }

  const result =
    mode.value === 'register'
      ? await register({ email: email.value, password: password.value, name: name.value || undefined })
      : await login({ email: email.value, password: password.value, remember: remember.value })

  if (result) {
    emit('success')
  }
}

onMounted(() => emailRef.value?.focus())
</script>

<style scoped>
.login-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.field__label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-muted);
}
.field__control {
  position: relative;
  display: flex;
  align-items: center;
  height: 46px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: var(--bg);
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
}
.field.has-error .field__control {
  border-color: var(--danger);
}
.field__control:focus-within {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-soft);
}
.field.has-error .field__control:focus-within {
  border-color: var(--danger);
  box-shadow: 0 0 0 3px var(--danger-soft);
}
.field__icon {
  margin: 0 12px;
  color: var(--text-subtle);
  flex: 0 0 auto;
}
.field__input {
  flex: 1;
  min-width: 0;
  height: 100%;
  border: none;
  background: transparent;
  padding-right: 12px;
}
.field__input:focus { outline: none; }
.field__toggle {
  display: inline-grid;
  place-items: center;
  width: 38px;
  height: 100%;
  color: var(--text-subtle);
  transition: color 0.18s ease;
}
.field__toggle:hover { color: var(--text); }
.field__error {
  font-size: 12px;
  color: var(--danger);
}

.login-form__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  color: var(--text-muted);
}
.login-form__remember {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}
.login-form__link {
  color: var(--primary);
}
.login-form__link:hover { text-decoration: underline; }

.login-form__submit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 46px;
  border-radius: var(--radius-sm);
  background: var(--primary);
  color: #fff;
  font-weight: 700;
  font-size: 15px;
  transition: background-color 0.18s ease, transform 0.18s ease, opacity 0.18s ease;
}
.login-form__submit:hover:not(:disabled) { background: var(--primary-hover); }
.login-form__submit:active:not(:disabled) { transform: scale(0.98); }
.login-form__submit:disabled { opacity: 0.6; cursor: not-allowed; }

.login-form__switch {
  text-align: center;
  font-size: 13px;
  color: var(--text-muted);
}
.login-form__switch a {
  color: var(--primary);
  font-weight: 600;
  margin-left: 4px;
}
.login-form__switch a:hover { text-decoration: underline; }

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.5);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
