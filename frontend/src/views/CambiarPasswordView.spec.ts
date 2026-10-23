import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import CambiarPasswordView from './CambiarPasswordView.vue'
import { useAuthStore } from '../stores/auth'

vi.mock('../api/users', async () => {
  const actual = await vi.importActual<typeof import('../api/users')>('../api/users')
  return { ...actual, changeOwnPassword: vi.fn() }
})
import { changeOwnPassword } from '../api/users'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [{ path: '/', component: { template: '<div />' } }, { path: '/coachee/mi-aprendizaje', component: { template: '<div />' } }],
})

const PASSWORD_VALIDA = 'Contraseña-Segura-123'

describe('CambiarPasswordView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(changeOwnPassword).mockReset()
  })

  async function rellenar(wrapper: ReturnType<typeof mount>, nueva: string, confirmacion: string) {
    const inputs = wrapper.findAll('input')
    await inputs[0].setValue('temporal')
    await inputs[1].setValue(nueva)
    await inputs[2].setValue(confirmacion)
  }

  it('sends the coachee to Mi Aprendizaje (same destination as the router) after changing the password', async () => {
    vi.mocked(changeOwnPassword).mockResolvedValue(undefined as never)
    const auth = useAuthStore()
    vi.spyOn(auth, 'restoreSession').mockImplementation(async () => {
      auth.user = { id: 'u1', email: 'a@b.cl', role: 'coachee' } as never
    })
    const replace = vi.spyOn(router, 'replace')

    const wrapper = mount(CambiarPasswordView, { global: { plugins: [router] } })
    await rellenar(wrapper, PASSWORD_VALIDA, PASSWORD_VALIDA)
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(replace).toHaveBeenCalledWith('/coachee/mi-aprendizaje')
  })

  it('marks mismatched confirmation as invalid and announces the error', async () => {
    const wrapper = mount(CambiarPasswordView, { global: { plugins: [router] } })
    await rellenar(wrapper, PASSWORD_VALIDA, 'otra-cosa')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.find('[role="alert"]').text()).toContain('no coinciden')
    expect(wrapper.findAll('input')[2].attributes('aria-invalid')).toBe('true')
    expect(changeOwnPassword).not.toHaveBeenCalled()
  })

  it('changes the button text while saving', async () => {
    let resolver: () => void = () => {}
    vi.mocked(changeOwnPassword).mockReturnValue(new Promise<never>((r) => { resolver = () => r(undefined as never) }))
    const auth = useAuthStore()
    vi.spyOn(auth, 'restoreSession').mockResolvedValue(undefined as never)

    const wrapper = mount(CambiarPasswordView, { global: { plugins: [router] } })
    await rellenar(wrapper, PASSWORD_VALIDA, PASSWORD_VALIDA)
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.find('button[type="submit"]').text()).toBe('Guardando…')
    resolver()
    await flushPromises()
  })
})
