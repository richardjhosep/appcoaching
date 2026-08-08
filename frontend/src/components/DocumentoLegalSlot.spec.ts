import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import DocumentoLegalSlot from './DocumentoLegalSlot.vue'
import type { DocumentoLegal } from '../api/legal'

vi.mock('../api/legal', async () => {
  const actual = await vi.importActual<typeof import('../api/legal')>('../api/legal')
  return { ...actual, upsertDocumentoLegal: vi.fn(), descargarAcuerdo: vi.fn() }
})

import { upsertDocumentoLegal, descargarAcuerdo } from '../api/legal'

const firmado: DocumentoLegal = {
  estado: 'firmado',
  fecha: null,
  vigencia: null,
  tieneArchivo: false,
}

describe('DocumentoLegalSlot', () => {
  beforeEach(() => {
    vi.mocked(upsertDocumentoLegal).mockResolvedValue(firmado)
    vi.mocked(descargarAcuerdo).mockResolvedValue(undefined)
  })

  it('shows "Firmado" (not "Sin firmar todavía") when estado is firmado even without a fecha — congruence fix', () => {
    const wrapper = mount(DocumentoLegalSlot, {
      props: {
        target: { empresaId: 'e1' },
        tipo: 'nda',
        label: 'NDA',
        doc: firmado,
        nombreParaArchivo: 'Empresa Uno',
      },
    })

    expect(wrapper.text()).toContain('Firmado')
    expect(wrapper.text()).not.toContain('Sin firmar todavía')
  })

  it('shows "Vencido" when firmado but vigencia already passed', () => {
    const wrapper = mount(DocumentoLegalSlot, {
      props: {
        target: { empresaId: 'e1' },
        tipo: 'contrato',
        label: 'Contrato',
        doc: { estado: 'firmado', fecha: '2020-01-01', vigencia: '2020-06-01', tieneArchivo: false },
        nombreParaArchivo: 'Empresa Uno',
      },
    })

    expect(wrapper.text()).toContain('Vencido')
    expect(wrapper.text()).toContain('necesita renovarse')
  })

  it('shows the download link only when tieneArchivo is true', () => {
    const conArchivo = mount(DocumentoLegalSlot, {
      props: {
        target: { empresaId: 'e1' },
        tipo: 'nda',
        label: 'NDA',
        doc: { ...firmado, tieneArchivo: true },
        nombreParaArchivo: 'Empresa Uno',
      },
    })
    expect(conArchivo.text()).toContain('Ver documento')

    const sinArchivo = mount(DocumentoLegalSlot, {
      props: {
        target: { empresaId: 'e1' },
        tipo: 'nda',
        label: 'NDA',
        doc: { estado: 'pendiente', fecha: null, vigencia: null, tieneArchivo: false },
        nombreParaArchivo: 'Empresa Uno',
      },
    })
    expect(sinArchivo.text()).not.toContain('Ver documento')
  })

  it('opens the editor, saves, and emits the updated documento', async () => {
    const wrapper = mount(DocumentoLegalSlot, {
      props: {
        target: { coacheeId: 'c1' },
        tipo: 'contrato',
        label: 'Contrato',
        doc: { estado: 'pendiente', fecha: null, vigencia: null, tieneArchivo: false },
        nombreParaArchivo: 'Rodrigo Peña',
      },
    })

    await wrapper.find('button').trigger('click') // "Adjuntar PDF" toggles the editor
    await wrapper.find('select').setValue('firmado')
    const guardarBtn = wrapper.findAll('button').find((b) => b.text() === 'Guardar')
    await guardarBtn!.trigger('click')
    await flushPromises()

    expect(upsertDocumentoLegal).toHaveBeenCalledWith(
      { coacheeId: 'c1' },
      'contrato',
      expect.objectContaining({ estado: 'firmado' }),
    )
    expect(wrapper.emitted('actualizado')).toBeTruthy()
  })

  it('calls descargarAcuerdo with a filename built from the label and nombreParaArchivo', async () => {
    const wrapper = mount(DocumentoLegalSlot, {
      props: {
        target: { empresaId: 'e1' },
        tipo: 'nda',
        label: 'NDA',
        doc: { ...firmado, tieneArchivo: true },
        nombreParaArchivo: 'Empresa Uno',
      },
    })

    const verBtn = wrapper.findAll('button').find((b) => b.text().includes('Ver documento'))
    await verBtn!.trigger('click')

    expect(descargarAcuerdo).toHaveBeenCalledWith({ empresaId: 'e1' }, 'nda', 'NDA - Empresa Uno.pdf')
  })
})
