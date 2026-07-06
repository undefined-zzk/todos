import { describe, it, expect, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import TodoInput from '~/components/todos/TodoInput.vue'

describe('TodoInput.vue', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('renders the title input, priority select and submit button', () => {
    const wrapper = mount(TodoInput)
    expect(wrapper.find('input[type="text"]').exists()).toBe(true)
    expect(wrapper.find('select').exists()).toBe(true)
    expect(wrapper.find('button[type="submit"]').text()).toContain('添加')
  })

  it('disables the submit button until a non-empty title is entered', async () => {
    const wrapper = mount(TodoInput)
    const btn = wrapper.find('button[type="submit"]')
    expect(btn.attributes('disabled')).toBeDefined()
    const input = wrapper.find('input[type="text"]')
    await input.setValue('买菜')
    expect(btn.attributes('disabled')).toBeUndefined()
  })

  it('adds a todo on submit and clears the fields', async () => {
    const wrapper = mount(TodoInput)
    const input = wrapper.find('input[type="text"]')
    await input.setValue('写测试')
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()
    expect((input.element as HTMLInputElement).value).toBe('')
  })

  it('does nothing for a whitespace-only title', async () => {
    const wrapper = mount(TodoInput)
    await wrapper.find('input[type="text"]').setValue('   ')
    expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeDefined()
  })
})
