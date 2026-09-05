import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import LoginView from './LoginView.vue'
import { useAuthStore } from '../stores/auth'
import { ApiError } from '../api/client'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', name: 'home', component: { template: '<div />' } },
    { path: '/login', name: 'login', component: { template: '<div />' } },
  ],
})

async function mountView() {
  const wrapper = mount(LoginView, { global: { plugins: [router] } })
  return wrapper
}

describe('LoginView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('shows the password toggle button and starts masked', () => {
    const wrapper = mount(LoginView, { global: { plugins: [router] } })

    const passwordInput = wrapper.find('input[type="password"]')
    expect(passwordInput.exists()).toBe(true)

    const toggleBtn = wrapper.findAll('button').find((b) => b.attributes('aria-label')?.includes('contraseña'))
    expect(toggleBtn).toBeTruthy()
  })

  it('reveals the password as plain text when the toggle is clicked', async () => {
    const wrapper = await mountView()

    const toggleBtn = wrapper.findAll('button').find((b) => b.attributes('aria-label') === 'Mostrar contraseña')
    await toggleBtn!.trigger('click')

    expect(wrapper.find('input[type="text"][autocomplete="current-password"]').exists()).toBe(true)
  })

  it('logs in and redirects home on success', async () => {
    const auth = useAuthStore()
    auth.login = vi.fn().mockResolvedValue(undefined)
    const pushSpy = vi.spyOn(router, 'push')

    const wrapper = await mountView()
    await wrapper.find('input[type="email"]').setValue('coach@test.com')
    await wrapper.find('input[type="password"]').setValue('QaVerify123!')
    await wrapper.find('form').trigger('submit')
    await wrapper.vm.$nextTick()

    expect(auth.login).toHaveBeenCalledWith('coach@test.com', 'QaVerify123!')
    expect(pushSpy).toHaveBeenCalledWith('/')
  })

  it('shows an error message when login fails', async () => {
    const auth = useAuthStore()
    auth.login = vi.fn().mockRejectedValue(new ApiError(401, 'Credenciales inválidas.'))

    const wrapper = await mountView()
    await wrapper.find('input[type="email"]').setValue('coach@test.com')
    await wrapper.find('input[type="password"]').setValue('mala')
    await wrapper.find('form').trigger('submit')
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Credenciales inválidas.')
  })
})
