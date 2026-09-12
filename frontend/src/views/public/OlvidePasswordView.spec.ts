import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import OlvidePasswordView from './OlvidePasswordView.vue'
import { ApiError } from '../../api/client'

vi.mock('../../api/auth', async () => {
  const actual = await vi.importActual<typeof import('../../api/auth')>('../../api/auth')
  return { ...actual, forgotPassword: vi.fn() }
})

import { forgotPassword } from '../../api/auth'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/login', name: 'login', component: { template: '<div />' } },
    { path: '/olvide-password', name: 'olvide-password', component: { template: '<div />' } },
  ],
})

describe('OlvidePasswordView', () => {
  beforeEach(() => {
    vi.mocked(forgotPassword).mockReset()
  })

  it('sends the email and shows the generic confirmation message', async () => {
    vi.mocked(forgotPassword).mockResolvedValue({ success: true })

    const wrapper = mount(OlvidePasswordView, { global: { plugins: [router] } })
    await wrapper.find('input[type="email"]').setValue('maria@demo.cl')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(forgotPassword).toHaveBeenCalledWith('maria@demo.cl')
    expect(wrapper.text()).toContain('Revisa tu correo')
    expect(wrapper.text()).toContain('maria@demo.cl')
  })

  it('shows an error message when the request fails', async () => {
    vi.mocked(forgotPassword).mockRejectedValue(new ApiError(429, 'Demasiadas solicitudes. Intenta de nuevo en un momento.'))

    const wrapper = mount(OlvidePasswordView, { global: { plugins: [router] } })
    await wrapper.find('input[type="email"]').setValue('maria@demo.cl')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('Demasiadas solicitudes')
    expect(wrapper.text()).not.toContain('Revisa tu correo')
  })
})
