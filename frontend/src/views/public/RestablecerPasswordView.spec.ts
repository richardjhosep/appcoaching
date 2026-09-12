import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import RestablecerPasswordView from './RestablecerPasswordView.vue'
import { ApiError } from '../../api/client'

vi.mock('../../api/auth', async () => {
  const actual = await vi.importActual<typeof import('../../api/auth')>('../../api/auth')
  return { ...actual, resetPassword: vi.fn() }
})

import { resetPassword } from '../../api/auth'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/login', name: 'login', component: { template: '<div />' } },
    { path: '/olvide-password', name: 'olvide-password', component: { template: '<div />' } },
    { path: '/restablecer-contrasena/:token', name: 'restablecer-contrasena', component: { template: '<div />' } },
  ],
})

function mountView(token = 'tok-abc') {
  return mount(RestablecerPasswordView, { props: { token }, global: { plugins: [router] } })
}

describe('RestablecerPasswordView', () => {
  beforeEach(() => {
    vi.mocked(resetPassword).mockReset()
  })

  it('rejects a weak password before calling the API', async () => {
    const wrapper = mountView()
    await wrapper.find('input[type="password"]').setValue('corta')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(resetPassword).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('al menos 12 caracteres')
  })

  it('rejects mismatched confirmation before calling the API', async () => {
    const wrapper = mountView()
    const passwordInputs = wrapper.findAll('input[type="password"]')
    await passwordInputs[0]!.setValue('NuevaClave#2026Segura')
    await passwordInputs[1]!.setValue('OtraClave#2026Distinta')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(resetPassword).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('no coinciden')
  })

  it('resets the password and shows the confirmation screen', async () => {
    vi.mocked(resetPassword).mockResolvedValue({ success: true })

    const wrapper = mountView('tok-abc')
    const passwordInputs = wrapper.findAll('input[type="password"]')
    await passwordInputs[0]!.setValue('NuevaClave#2026Segura')
    await passwordInputs[1]!.setValue('NuevaClave#2026Segura')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(resetPassword).toHaveBeenCalledWith('tok-abc', 'NuevaClave#2026Segura')
    expect(wrapper.text()).toContain('Contraseña actualizada')
  })

  it('shows the expired-link error with a way to request a new one', async () => {
    vi.mocked(resetPassword).mockRejectedValue(new ApiError(401, 'El enlace no es válido o ya expiró.'))

    const wrapper = mountView()
    const passwordInputs = wrapper.findAll('input[type="password"]')
    await passwordInputs[0]!.setValue('NuevaClave#2026Segura')
    await passwordInputs[1]!.setValue('NuevaClave#2026Segura')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('no es válido o ya expiró')
    expect(wrapper.text()).toContain('Pedir un enlace nuevo')
  })
})
