import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import DocumentosCoacheePanel from './DocumentosCoacheePanel.vue'
import { useAuthStore } from '../stores/auth'
import type { DocumentoCoachee } from '../api/documentosCoachee'

vi.mock('../api/documentosCoachee', async () => {
  const actual = await vi.importActual<typeof import('../api/documentosCoachee')>('../api/documentosCoachee')
  return {
    ...actual,
    listarDocumentosCoachee: vi.fn(),
    subirDocumentoCoachee: vi.fn(),
    eliminarDocumentoCoachee: vi.fn(),
    descargarDocumentoCoachee: vi.fn(),
  }
})
vi.mock('../lib/notify', () => ({
  notifySuccess: vi.fn(),
  notifyError: vi.fn(),
  confirmDialog: vi.fn().mockResolvedValue(true),
}))

import { listarDocumentosCoachee, subirDocumentoCoachee } from '../api/documentosCoachee'

const cvDeLaEmpresa: DocumentoCoachee = {
  id: 'd1',
  coacheeId: 'c1',
  tipo: 'cv',
  descripcion: null,
  archivoNombre: 'CV Felipe.pdf',
  subidoPorUserId: 'u-empresa',
  subidoPorRol: 'empresa',
  createdAt: '2026-10-01T12:00:00.000Z',
}

describe('DocumentosCoacheePanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setActivePinia(createPinia())
    useAuthStore().user = { id: 'u-coachee', email: 'c@x.cl', role: 'coachee', empresaId: null, nombre: 'C', mustChangePassword: false }
  })

  it('shows which básicos are already uploaded (by anyone) and which are missing', async () => {
    vi.mocked(listarDocumentosCoachee).mockResolvedValue([cvDeLaEmpresa])
    const wrapper = mount(DocumentosCoacheePanel)
    await flushPromises()

    const checklist = wrapper.find('ul[aria-label="Documentos básicos del proceso"]').text()
    expect(checklist).toContain('✓ Currículum vitae')
    expect(checklist).toContain('Evaluación de desempeño — falta')
    expect(checklist).toContain('Descriptor de cargo — falta')
    expect(wrapper.text()).toContain('Subido por la empresa')
    // El coachee no puede borrar lo que subió la empresa.
    expect(wrapper.findAll('button').some((b) => b.text() === 'Eliminar')).toBe(false)
  })

  it('uploads for the own coachee (no coacheeId) and adds it to the list', async () => {
    vi.mocked(listarDocumentosCoachee).mockResolvedValue([])
    vi.mocked(subirDocumentoCoachee).mockResolvedValue({
      ...cvDeLaEmpresa,
      id: 'd2',
      tipo: 'descriptor_cargo',
      archivoNombre: 'Descriptor.docx',
      subidoPorUserId: 'u-coachee',
      subidoPorRol: 'coachee',
    })
    const wrapper = mount(DocumentosCoacheePanel)
    await flushPromises()

    await wrapper.find('select').setValue('descriptor_cargo')
    const file = new File(['x'], 'Descriptor.docx')
    const input = wrapper.find('input[type="file"]')
    Object.defineProperty(input.element, 'files', { value: [file] })
    await input.trigger('change')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(subirDocumentoCoachee).toHaveBeenCalledWith(
      { tipo: 'descriptor_cargo', descripcion: undefined, archivo: file },
      undefined,
    )
    expect(wrapper.text()).toContain('Subido por ti')
    expect(wrapper.text()).toContain('✓ Descriptor de cargo')
  })
})
