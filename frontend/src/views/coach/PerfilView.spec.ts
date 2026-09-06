import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import PerfilView from './PerfilView.vue'
import type { PerfilCoach, CertificacionCoach, ExperienciaCoach } from '../../api/perfilCoach'

vi.mock('../../api/perfilCoach', async () => {
  const actual = await vi.importActual<typeof import('../../api/perfilCoach')>('../../api/perfilCoach')
  return {
    ...actual,
    getMiPerfil: vi.fn(),
    updateMiPerfil: vi.fn(),
    subirFoto: vi.fn(),
    subirCv: vi.fn(),
    agregarCertificacion: vi.fn(),
    eliminarCertificacion: vi.fn(),
    agregarExperiencia: vi.fn(),
    eliminarExperiencia: vi.fn(),
    obtenerUrlFoto: vi.fn(),
    obtenerUrlLogoExperiencia: vi.fn(),
    descargarCv: vi.fn(),
    descargarCertificacion: vi.fn(),
  }
})
vi.mock('../../lib/notify', () => ({
  notifySuccess: vi.fn(),
  notifyError: vi.fn(),
}))

import {
  getMiPerfil,
  updateMiPerfil,
  subirFoto,
  subirCv,
  agregarCertificacion,
  eliminarCertificacion,
  agregarExperiencia,
  eliminarExperiencia,
  obtenerUrlFoto,
  obtenerUrlLogoExperiencia,
} from '../../api/perfilCoach'
import { notifySuccess, notifyError } from '../../lib/notify'

const perfilVacio: PerfilCoach = {
  id: 'p1',
  coachUserId: 'u1',
  nombre: '',
  titulo: null,
  bio: null,
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
  experiencias: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

describe('PerfilView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(getMiPerfil).mockResolvedValue(perfilVacio)
    vi.mocked(obtenerUrlFoto).mockResolvedValue(null)
    vi.mocked(obtenerUrlLogoExperiencia).mockResolvedValue(null)
  })

  it('loads the perfil into the form fields on mount', async () => {
    vi.mocked(getMiPerfil).mockResolvedValue({ ...perfilVacio, nombre: 'Fernando Ramos', titulo: 'Coach Ejecutivo' })
    const wrapper = mount(PerfilView)
    await flushPromises()

    expect((wrapper.find('input[required]').element as HTMLInputElement).value).toBe('Fernando Ramos')
  })

  it('saves the form fields with updateMiPerfil', async () => {
    vi.mocked(updateMiPerfil).mockResolvedValue({ ...perfilVacio, nombre: 'Fernando Ramos' })
    const wrapper = mount(PerfilView)
    await flushPromises()

    await wrapper.find('input[required]').setValue('Fernando Ramos')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(updateMiPerfil).toHaveBeenCalledWith(expect.objectContaining({ nombre: 'Fernando Ramos' }))
    expect(notifySuccess).toHaveBeenCalled()
  })

  it('saves the redes sociales and sitio web fields', async () => {
    vi.mocked(updateMiPerfil).mockResolvedValue(perfilVacio)
    const wrapper = mount(PerfilView)
    await flushPromises()

    await wrapper.find('input[required]').setValue('Fernando Ramos')
    await wrapper.find('input[placeholder="https://…"]').setValue('https://fernandoramos.cl')
    await wrapper.find('input[placeholder^="https://www.instagram.com"]').setValue('https://www.instagram.com/fernando')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(updateMiPerfil).toHaveBeenCalledWith(
      expect.objectContaining({
        sitioWeb: 'https://fernandoramos.cl',
        instagramUrl: 'https://www.instagram.com/fernando',
      }),
    )
  })

  it('uploads a foto when a file is selected', async () => {
    vi.mocked(subirFoto).mockResolvedValue({ ...perfilVacio, fotoPath: 'foto-abc.jpg' })
    const wrapper = mount(PerfilView)
    await flushPromises()

    const fotoInput = wrapper.find('input[type="file"][accept^="image"]')
    const file = new File(['contenido'], 'yo.jpg', { type: 'image/jpeg' })
    Object.defineProperty(fotoInput.element, 'files', { value: [file] })
    await fotoInput.trigger('change')
    await flushPromises()

    expect(subirFoto).toHaveBeenCalledWith(file)
  })

  it('uploads a CV when a PDF file is selected', async () => {
    vi.mocked(subirCv).mockResolvedValue({ ...perfilVacio, cvPath: 'cv-abc.pdf', cvNombre: 'CV.pdf' })
    const wrapper = mount(PerfilView)
    await flushPromises()

    const cvInput = wrapper.find('input[type="file"][accept="application/pdf"]')
    const file = new File(['contenido'], 'CV.pdf', { type: 'application/pdf' })
    Object.defineProperty(cvInput.element, 'files', { value: [file] })
    await cvInput.trigger('change')
    await flushPromises()

    expect(subirCv).toHaveBeenCalledWith(file)
    expect(notifySuccess).toHaveBeenCalled()
  })

  it('adds a certificación with the entered fields', async () => {
    const nuevaCert: CertificacionCoach = {
      id: 'c1',
      nombre: 'ICF ACC',
      entidadEmisora: 'ICF',
      fecha: null,
      archivoPath: null,
      archivoNombre: null,
      createdAt: '2026-01-01T00:00:00.000Z',
    }
    vi.mocked(agregarCertificacion).mockResolvedValue(nuevaCert)
    const wrapper = mount(PerfilView)
    await flushPromises()

    const forms = wrapper.findAll('form')
    const certForm = forms[forms.length - 1]
    await certForm.find('input[type="text"]').setValue('ICF ACC')
    await certForm.trigger('submit')
    await flushPromises()

    expect(agregarCertificacion).toHaveBeenCalledWith(expect.objectContaining({ nombre: 'ICF ACC' }))
    expect(wrapper.text()).toContain('ICF ACC')
  })

  it('adds an experiencia with the entered fields', async () => {
    const nuevaExp: ExperienciaCoach = {
      id: 'e1',
      empresa: 'Ferronor S.A.',
      cargo: 'Coach Ejecutivo',
      fechaInicio: '2022-01-01T00:00:00.000Z',
      fechaFin: null,
      descripcion: null,
      logoPath: null,
      logoNombre: null,
      createdAt: '2026-01-01T00:00:00.000Z',
    }
    vi.mocked(agregarExperiencia).mockResolvedValue(nuevaExp)
    const wrapper = mount(PerfilView)
    await flushPromises()

    const forms = wrapper.findAll('form')
    const expForm = forms[1]
    await expForm.find('input[type="text"]').setValue('Ferronor S.A.')
    await expForm.find('input[type="date"]').setValue('2022-01-01')
    await expForm.trigger('submit')
    await flushPromises()

    expect(agregarExperiencia).toHaveBeenCalledWith(
      expect.objectContaining({ empresa: 'Ferronor S.A.', fechaInicio: '2022-01-01' }),
    )
    expect(wrapper.text()).toContain('Ferronor S.A.')
  })

  it('deletes an experiencia', async () => {
    vi.mocked(getMiPerfil).mockResolvedValue({
      ...perfilVacio,
      experiencias: [
        {
          id: 'e1',
          empresa: 'Ferronor S.A.',
          cargo: null,
          fechaInicio: '2022-01-01T00:00:00.000Z',
          fechaFin: null,
          descripcion: null,
          logoPath: null,
          logoNombre: null,
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ],
    })
    vi.mocked(eliminarExperiencia).mockResolvedValue(undefined)
    const wrapper = mount(PerfilView)
    await flushPromises()

    const eliminarBtn = wrapper.findAll('button').find((b) => b.text() === 'Eliminar')
    await eliminarBtn!.trigger('click')
    await flushPromises()

    expect(eliminarExperiencia).toHaveBeenCalledWith('e1')
    expect(wrapper.text()).not.toContain('Ferronor S.A.')
  })

  it('deletes a certificación', async () => {
    vi.mocked(getMiPerfil).mockResolvedValue({
      ...perfilVacio,
      certificaciones: [
        { id: 'c1', nombre: 'ICF ACC', entidadEmisora: null, fecha: null, archivoPath: null, archivoNombre: null, createdAt: '2026-01-01T00:00:00.000Z' },
      ],
    })
    vi.mocked(eliminarCertificacion).mockResolvedValue(undefined)
    const wrapper = mount(PerfilView)
    await flushPromises()

    const eliminarBtn = wrapper.findAll('button').find((b) => b.text() === 'Eliminar')
    await eliminarBtn!.trigger('click')
    await flushPromises()

    expect(eliminarCertificacion).toHaveBeenCalledWith('c1')
    expect(wrapper.text()).not.toContain('ICF ACC')
  })

  it('shows an error notification when saving fails', async () => {
    vi.mocked(updateMiPerfil).mockRejectedValue(new Error('falló'))
    const wrapper = mount(PerfilView)
    await flushPromises()

    await wrapper.find('input[required]').setValue('Fernando Ramos')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(notifyError).toHaveBeenCalled()
  })
})
