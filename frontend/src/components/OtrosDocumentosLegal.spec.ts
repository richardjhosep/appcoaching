import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import OtrosDocumentosLegal from './OtrosDocumentosLegal.vue'
import type { DocumentoAdicionalLegal } from '../api/legal'

vi.mock('../api/legal', async () => {
  const actual = await vi.importActual<typeof import('../api/legal')>('../api/legal')
  return {
    ...actual,
    subirAdicional: vi.fn(),
    descargarAdicional: vi.fn(),
    eliminarAdicional: vi.fn(),
  }
})

import { subirAdicional, descargarAdicional, eliminarAdicional } from '../api/legal'

const documentos: DocumentoAdicionalLegal[] = [
  {
    id: 'a1',
    empresaId: 'e1',
    coacheeId: null,
    titulo: 'Correo de aprobación',
    archivoNombre: 'correo.pdf',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
]

describe('OtrosDocumentosLegal', () => {
  beforeEach(() => {
    vi.mocked(subirAdicional).mockResolvedValue(documentos[0])
    vi.mocked(descargarAdicional).mockResolvedValue(undefined)
    vi.mocked(eliminarAdicional).mockResolvedValue(undefined)
  })

  it('shows the count collapsed, and the list once expanded', async () => {
    const wrapper = mount(OtrosDocumentosLegal, {
      props: { target: { empresaId: 'e1' }, documentos },
    })

    expect(wrapper.text()).toContain('Otros documentos (1)')
    expect(wrapper.text()).not.toContain('Correo de aprobación')

    await wrapper.find('button').trigger('click')

    expect(wrapper.text()).toContain('Correo de aprobación')
  })

  it('downloads a document by clicking its title', async () => {
    const wrapper = mount(OtrosDocumentosLegal, {
      props: { target: { empresaId: 'e1' }, documentos },
    })
    await wrapper.find('button').trigger('click')

    const link = wrapper.findAll('button').find((b) => b.text().includes('Correo de aprobación'))
    await link!.trigger('click')

    expect(descargarAdicional).toHaveBeenCalledWith('a1', 'correo.pdf')
  })

  it('deletes a document and emits cambio', async () => {
    const wrapper = mount(OtrosDocumentosLegal, {
      props: { target: { empresaId: 'e1' }, documentos },
    })
    await wrapper.find('button').trigger('click')

    const eliminarBtn = wrapper.findAll('button').find((b) => b.text() === 'Eliminar')
    await eliminarBtn!.trigger('click')
    await flushPromises()

    expect(eliminarAdicional).toHaveBeenCalledWith('a1')
    expect(wrapper.emitted('cambio')).toBeTruthy()
  })

  it('uploads a new document with a título and emits cambio', async () => {
    const wrapper = mount(OtrosDocumentosLegal, {
      props: { target: { coacheeId: 'c1' }, documentos: [] },
    })
    await wrapper.find('button').trigger('click')

    await wrapper.find('input[type="text"]').setValue('Addendum firmado')
    const fileInput = wrapper.find('input[type="file"]')
    const file = new File(['contenido'], 'addendum.pdf', { type: 'application/pdf' })
    Object.defineProperty(fileInput.element, 'files', { value: [file] })
    await fileInput.trigger('change')

    const agregarBtn = wrapper.findAll('button').find((b) => b.text().includes('Agregar'))
    await agregarBtn!.trigger('click')
    await flushPromises()

    expect(subirAdicional).toHaveBeenCalledWith({ coacheeId: 'c1' }, 'Addendum firmado', file)
    expect(wrapper.emitted('cambio')).toBeTruthy()
  })
})
