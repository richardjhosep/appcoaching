import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import PerfilCoachContenido from './PerfilCoachContenido.vue'
import type { PerfilCoach } from '../api/perfilCoach'

vi.mock('../api/perfilCoach', async () => {
  const actual = await vi.importActual<typeof import('../api/perfilCoach')>('../api/perfilCoach')
  return {
    ...actual,
    obtenerUrlFoto: vi.fn(),
    descargarCv: vi.fn(),
    descargarCertificacion: vi.fn(),
  }
})

import { obtenerUrlFoto } from '../api/perfilCoach'

const perfilBase: PerfilCoach = {
  id: 'p1',
  coachUserId: 'u1',
  nombre: 'Fernando Ramos',
  titulo: 'Coach Ejecutivo',
  bio: 'Acompaño procesos de desarrollo de liderazgo.',
  linkedinUrl: 'https://www.linkedin.com/in/fernando',
  sitioWeb: 'https://fernandoramos.cl',
  instagramUrl: null,
  facebookUrl: null,
  youtubeUrl: null,
  telefono: '+56912345678',
  emailContacto: 'fernando@saltup.cl',
  metodologia: 'GROW y fortalezas.',
  fotoPath: null,
  fotoNombre: null,
  cvPath: 'cv-abc.pdf',
  cvNombre: 'CV Fernando.pdf',
  certificaciones: [
    { id: 'c1', nombre: 'ICF ACC', entidadEmisora: 'International Coach Federation', fecha: null, archivoPath: 'cert-1.pdf', archivoNombre: 'icf.pdf', createdAt: '2026-01-01T00:00:00.000Z' },
  ],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

describe('PerfilCoachContenido', () => {
  beforeEach(() => {
    vi.mocked(obtenerUrlFoto).mockResolvedValue(null)
  })

  it('shows bio, metodología, contacto and certificaciones from the perfil', async () => {
    const wrapper = mount(PerfilCoachContenido, { props: { perfil: perfilBase } })
    await flushPromises()

    expect(wrapper.text()).toContain('Fernando Ramos')
    expect(wrapper.text()).toContain('Coach Ejecutivo')
    expect(wrapper.text()).toContain('Acompaño procesos de desarrollo de liderazgo.')
    expect(wrapper.text()).toContain('GROW y fortalezas.')
    expect(wrapper.text()).toContain('ICF ACC')
    expect(wrapper.text()).toContain('International Coach Federation')
    expect(wrapper.text()).toContain('fernando@saltup.cl')
    expect(wrapper.text()).toContain('LinkedIn')
    expect(wrapper.text()).toContain('Sitio web')
  })

  it('only shows the redes sociales links that are set', async () => {
    const wrapper = mount(PerfilCoachContenido, {
      props: { perfil: { ...perfilBase, instagramUrl: 'https://www.instagram.com/fernando', facebookUrl: null, youtubeUrl: null } },
    })
    await flushPromises()

    expect(wrapper.text()).toContain('Instagram')
    expect(wrapper.text()).not.toContain('Facebook')
    expect(wrapper.text()).not.toContain('YouTube')
  })

  it('shows empty-state copy when the perfil has no bio or certificaciones', async () => {
    const vacio: PerfilCoach = {
      ...perfilBase,
      bio: null,
      metodologia: null,
      linkedinUrl: null,
      sitioWeb: null,
      telefono: null,
      emailContacto: null,
      cvPath: null,
      certificaciones: [],
    }
    const wrapper = mount(PerfilCoachContenido, { props: { perfil: vacio } })
    await flushPromises()

    expect(wrapper.text()).toContain('Todavía no hay una presentación publicada.')
    expect(wrapper.text()).toContain('Sin certificaciones registradas todavía.')
  })

  it('renders the uploaded foto as an img when obtenerUrlFoto resolves a url', async () => {
    vi.mocked(obtenerUrlFoto).mockResolvedValue('blob:mock-url')
    const wrapper = mount(PerfilCoachContenido, {
      props: { perfil: { ...perfilBase, fotoPath: 'foto-abc.jpg' } },
    })
    await flushPromises()

    expect(wrapper.find('img').attributes('src')).toBe('blob:mock-url')
  })
})
