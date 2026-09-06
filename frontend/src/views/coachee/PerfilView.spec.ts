import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import PerfilView from './PerfilView.vue'
import type { Coachee } from '../../api/coachees'

vi.mock('../../api/coachees', async () => {
  const actual = await vi.importActual<typeof import('../../api/coachees')>('../../api/coachees')
  return {
    ...actual,
    getMyCoachee: vi.fn(),
    actualizarMiPerfil: vi.fn(),
    subirFotoCoachee: vi.fn(),
    obtenerUrlMiFotoCoachee: vi.fn(),
  }
})
vi.mock('../../lib/notify', () => ({
  notifySuccess: vi.fn(),
  notifyError: vi.fn(),
}))

import {
  getMyCoachee,
  actualizarMiPerfil,
  subirFotoCoachee,
  obtenerUrlMiFotoCoachee,
} from '../../api/coachees'
import { notifySuccess } from '../../lib/notify'

const coacheeBase: Coachee = {
  id: 'c1',
  nombre: 'Rodrigo Peña',
  empresaId: null,
  telefono: '+56911112222',
  emailContacto: 'rodrigo@personal.com',
  fotoPath: null,
  fotoNombre: null,
  bio: null,
  compartirPerfilConCoach: false,
  consentimientoInformado: true,
  consentimientoFecha: '2026-08-01T00:00:00.000Z',
}

describe('PerfilView (coachee)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(getMyCoachee).mockResolvedValue(coacheeBase)
    vi.mocked(obtenerUrlMiFotoCoachee).mockResolvedValue(null)
  })

  it('loads the coachee data into the form, with nombre read-only', async () => {
    const wrapper = mount(PerfilView)
    await flushPromises()

    expect((wrapper.find('input[disabled]').element as HTMLInputElement).value).toBe('Rodrigo Peña')
    expect((wrapper.find('input[type="tel"]').element as HTMLInputElement).value).toBe('+56911112222')
    expect(wrapper.text()).toContain('RP')
  })

  it('saves telefono, email, bio and the compartir toggle', async () => {
    vi.mocked(actualizarMiPerfil).mockResolvedValue({
      ...coacheeBase,
      bio: 'Me gusta correr.',
      compartirPerfilConCoach: true,
    })
    const wrapper = mount(PerfilView)
    await flushPromises()

    await wrapper.find('textarea').setValue('Me gusta correr.')
    await wrapper.find('input[type="checkbox"]').setValue(true)
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(actualizarMiPerfil).toHaveBeenCalledWith(
      expect.objectContaining({ bio: 'Me gusta correr.', compartirPerfilConCoach: true }),
    )
    expect(notifySuccess).toHaveBeenCalled()
  })

  it('uploads a foto when a file is selected', async () => {
    vi.mocked(subirFotoCoachee).mockResolvedValue({ ...coacheeBase, fotoPath: 'foto-abc.jpg' })
    const wrapper = mount(PerfilView)
    await flushPromises()

    const fotoInput = wrapper.find('input[type="file"]')
    const file = new File(['contenido'], 'yo.jpg', { type: 'image/jpeg' })
    Object.defineProperty(fotoInput.element, 'files', { value: [file] })
    await fotoInput.trigger('change')
    await flushPromises()

    expect(subirFotoCoachee).toHaveBeenCalledWith(file)
  })

  it('renders the uploaded foto as an img when obtenerUrlMiFotoCoachee resolves a url', async () => {
    vi.mocked(getMyCoachee).mockResolvedValue({ ...coacheeBase, fotoPath: 'foto-abc.jpg' })
    vi.mocked(obtenerUrlMiFotoCoachee).mockResolvedValue('blob:mock-url')

    const wrapper = mount(PerfilView)
    await flushPromises()

    expect(wrapper.find('img').attributes('src')).toBe('blob:mock-url')
  })
})
