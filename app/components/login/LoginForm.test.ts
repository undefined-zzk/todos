import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import LoginForm from '~/components/login/LoginForm.vue'

// The form calls useAuth().login which routes through the Supabase fake.
// Tests that submit valid credentials await the resolved promise via
// flushPromises.

describe('LoginForm.vue', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  function mountForm() {
    return mount(LoginForm, { attachTo: document.body })
  }

  async function fill(wrapper: ReturnType<typeof mountForm>, email: string, password: string) {
    const inputs = wrapper.findAll('input')
    await inputs[0]!.setValue(email)
    await inputs[1]!.setValue(password)
  }

  it('renders email + password fields and a submit button', () => {
    const wrapper = mountForm()
    expect(wrapper.find('input[type="email"]').exists()).toBe(true)
    expect(wrapper.find('input[type="password"]').exists()).toBe(true)
    expect(wrapper.find('button[type="submit"]').text()).toContain('登录')
  })

  it('shows validation errors when submitted empty', async () => {
    const wrapper = mountForm()
    await wrapper.find('form').trigger('submit.prevent')
    expect(wrapper.text()).toContain('请输入邮箱')
    expect(wrapper.text()).toContain('请输入密码')
  })

  it('flags an invalid email format', async () => {
    const wrapper = mountForm()
    await fill(wrapper, 'not-an-email', 'password123')
    await wrapper.find('form').trigger('submit.prevent')
    expect(wrapper.text()).toContain('邮箱格式不正确')
  })

  it('requires at least 6 characters for the password', async () => {
    const wrapper = mountForm()
    await fill(wrapper, 'good@example.com', '12345')
    await wrapper.find('form').trigger('submit.prevent')
    expect(wrapper.text()).toContain('密码至少 6 位')
  })

  it('emits success on valid credentials', async () => {
    const wrapper = mountForm()
    await fill(wrapper, 'tester@example.com', 'password123')
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()
    expect(wrapper.emitted('success')).toBeTruthy()
  })

  it('toggles password visibility', async () => {
    const wrapper = mountForm()
    const passwordInput = wrapper.find('input[type="password"]')
    expect(passwordInput.attributes('type')).toBe('password')
    await wrapper.find('.field__toggle').trigger('click')
    expect(wrapper.find('input[type="text"]').exists()).toBe(true)
  })

  it('clears the email error when the user types again', async () => {
    const wrapper = mountForm()
    await wrapper.find('form').trigger('submit.prevent')
    expect(wrapper.text()).toContain('请输入邮箱')
    await wrapper.find('input[type="email"]').setValue('a@b.com')
    await nextTick()
    expect(wrapper.text()).not.toContain('请输入邮箱')
  })

  it('switches to register mode and shows the nickname field', async () => {
    const wrapper = mountForm()
    expect(wrapper.find('input[type="text"]').exists()).toBe(false)
    expect(wrapper.find('button[type="submit"]').text()).toContain('登录')
    await wrapper.find('.login-form__switch a').trigger('click')
    expect(wrapper.find('input[type="text"]').exists()).toBe(true)
    expect(wrapper.find('button[type="submit"]').text()).toContain('注册')
  })

  it('emits success on valid register credentials', async () => {
    const wrapper = mountForm()
    await wrapper.find('.login-form__switch a').trigger('click')
    // register mode has: text(name) + email + password
    const emailInput = wrapper.find('input[type="email"]')
    const passwordInput = wrapper.find('input[type="password"]')
    await emailInput.setValue('newbie@example.com')
    await passwordInput.setValue('password123')
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()
    expect(wrapper.emitted('success')).toBeTruthy()
  })
})
