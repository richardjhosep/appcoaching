import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import MiCoachView from './MiCoachView.vue'
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
  bio: 'Bio real del coach.',
  linkedinUrl: null,
  sitioWeb: null,
  instagramUrl: null,
  facebookUrl: null,
  youtubeUrl: null,
  telefono: null,
  emailContacto: null,
  metodologia: null,
  fotoPath: null,
  fotoNombre: null,
  cvPath: null,
  cvNombre: null,
  certificaciones: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

describe('MiCoachView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(getPerfilCoach).mockResolvedValue(perfil)
    vi.mocked(obtenerUrlFoto).mockResolvedValue(null)
  })

  it('loads and shows the coach perfil for the coachee', async () => {
    const wrapper = mount(MiCoachView)
    await flushPromises()

    expect(getPerfilCoach).toHaveBeenCalled()
    expect(wrapper.text()).toContain('Fernando Ramos')
    expect(wrapper.text()).toContain('Bio real del coach.')
  })
})
