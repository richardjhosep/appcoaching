import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import PerfilCoachView from './PerfilCoachView.vue'
import type { PerfilCoach } from '../../api/perfilCoach'

vi.mock('../../api/perfilCoach', async () => {
  const actual = await vi.importActual<typeof import('../../api/perfilCoach')>('../../api/perfilCoach')
  return {
    ...actual,
    getPerfilCoach: vi.fn(),
    obtenerUrlFoto: vi.fn(),
  }
})

import { getPerfilCoach, obtenerUrlFoto } from '../../api/perfilCoach'

const perfil: PerfilCoach = {
  id: 'p1',
  coachUserId: 'u1',
  nombre: 'Fernando Ramos',
  titulo: 'Coach Ejecutivo',
  bio: 'Integro 20 años liderando equipos.',
  linkedinUrl: 'https://www.linkedin.com/in/fernando',
  sitioWeb: null,
  instagramUrl: null,
  facebookUrl: null,
  youtubeUrl: null,
  telefono: '+56984127466',
  emailContacto: 'fernando@saltup.cl',
  metodologia: 'GROW y fortalezas.',
  fotoPath: null,
  fotoNombre: null,
  cvPath: null,
  cvNombre: null,
  certificaciones: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

describe('PerfilCoachView (empresa)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(getPerfilCoach).mockResolvedValue(perfil)
    vi.mocked(obtenerUrlFoto).mockResolvedValue(null)
  })

  it('loads the real coach perfil instead of hardcoded content', async () => {
    const wrapper = mount(PerfilCoachView)
    await flushPromises()

    expect(getPerfilCoach).toHaveBeenCalled()
    expect(wrapper.text()).toContain('Fernando Ramos')
    expect(wrapper.text()).toContain('Integro 20 años liderando equipos.')
    expect(wrapper.text()).toContain('fernando@saltup.cl')
  })
})
