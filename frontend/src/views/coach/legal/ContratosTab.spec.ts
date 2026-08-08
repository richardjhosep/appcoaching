import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import ContratosTab from './ContratosTab.vue'
import type { ResumenLegal, DocumentoAdicionalLegal } from '../../../api/legal'
import type { CoacheeListItem } from '../../../api/coachees'

vi.mock('../../../api/legal', async () => {
  const actual = await vi.importActual<typeof import('../../../api/legal')>('../../../api/legal')
  return {
    ...actual,
    getResumenLegal: vi.fn(),
    listarAdicionales: vi.fn(),
    upsertDocumentoLegal: vi.fn(),
    descargarAcuerdo: vi.fn(),
    subirAdicional: vi.fn(),
    descargarAdicional: vi.fn(),
    eliminarAdicional: vi.fn(),
  }
})
vi.mock('../../../api/coachees', async () => {
  const actual = await vi.importActual<typeof import('../../../api/coachees')>('../../../api/coachees')
  return {
    ...actual,
    listCoachees: vi.fn(),
    setConsentimiento: vi.fn(),
    solicitarConsentimiento: vi.fn(),
  }
})
vi.mock('../../../lib/notify', () => ({
  notifySuccess: vi.fn(),
  notifyError: vi.fn(),
}))

import { getResumenLegal, listarAdicionales } from '../../../api/legal'
import { listCoachees, setConsentimiento, solicitarConsentimiento } from '../../../api/coachees'
import { notifySuccess, notifyError } from '../../../lib/notify'

// Empresa Uno: falta el NDA (necesita acción), creada 2026-01-01.
// Independiente Uno: falta contrato y NDA (necesita acción), creado 2025-01-01 — más antigua que
// Empresa Uno, así que debería aparecer primero pese a ser un independiente.
// Independiente Dos: contrato y NDA firmados y vigentes (al día), creado 2020-01-01 — es el más
// antiguo de los tres, pero al no necesitar acción va al final.
const resumen: ResumenLegal = {
  empresas: [
    {
      empresaId: 'e1',
      nombre: 'Empresa Uno',
      contrato: { estado: 'firmado', fecha: '2026-01-01', vigencia: '2027-01-01', tieneArchivo: true },
      nda: { estado: 'pendiente', fecha: null, vigencia: null, tieneArchivo: false },
      coacheesConConsentimiento: 1,
      coacheesTotal: 2,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
  ],
  independientes: [
    {
      coacheeId: 'c3',
      nombre: 'Independiente Uno',
      contrato: { estado: 'pendiente', fecha: null, vigencia: null, tieneArchivo: false },
      nda: { estado: 'pendiente', fecha: null, vigencia: null, tieneArchivo: false },
      consentimientoInformado: false,
      createdAt: '2025-01-01T00:00:00.000Z',
    },
    {
      coacheeId: 'c4',
      nombre: 'Independiente Dos',
      contrato: { estado: 'firmado', fecha: '2020-01-01', vigencia: '2099-01-01', tieneArchivo: true },
      nda: { estado: 'firmado', fecha: '2020-01-01', vigencia: '2099-01-01', tieneArchivo: true },
      consentimientoInformado: true,
      createdAt: '2020-01-01T00:00:00.000Z',
    },
  ],
}

const coachees: CoacheeListItem[] = [
  { id: 'c1', nombre: 'Coachee Uno', empresaId: 'e1', consentimientoInformado: true, consentimientoFecha: '2026-01-01' },
  { id: 'c2', nombre: 'Coachee Dos', empresaId: 'e1', consentimientoInformado: false, consentimientoFecha: null },
  { id: 'c3', nombre: 'Independiente Uno', empresaId: null, consentimientoInformado: false, consentimientoFecha: null },
  { id: 'c4', nombre: 'Independiente Dos', empresaId: null, consentimientoInformado: true, consentimientoFecha: '2020-01-01' },
]

const adicionales: DocumentoAdicionalLegal[] = [
  {
    id: 'a1',
    empresaId: 'e1',
    coacheeId: null,
    titulo: 'Correo de aprobación',
    archivoNombre: 'correo.pdf',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
]

describe('ContratosTab', () => {
  beforeEach(() => {
    vi.mocked(getResumenLegal).mockResolvedValue(resumen)
    vi.mocked(listarAdicionales).mockResolvedValue(adicionales)
    vi.mocked(listCoachees).mockResolvedValue(coachees)
    vi.mocked(setConsentimiento).mockResolvedValue(coachees[1])
    vi.mocked(solicitarConsentimiento).mockResolvedValue({ success: true })
  })

  it('shows only 2 items on the first page, tagged by type', async () => {
    const wrapper = mount(ContratosTab)
    await flushPromises()

    const text = wrapper.text()
    expect(text).toContain('Independiente Uno')
    expect(text).toContain('Empresa Uno')
    expect(text).not.toContain('Independiente Dos')
    expect(text).toContain('Empresa')
    expect(text).toContain('Independiente')
  })

  it('prioritizes the oldest relationship that still needs action over one that is already up to date, even if older', async () => {
    const wrapper = mount(ContratosTab)
    await flushPromises()

    const headings = wrapper.findAll('h2, h3').map((h) => h.text())
    // Independiente Uno (2025, needs action) comes before Empresa Uno (2026, needs action);
    // Independiente Dos (2020, up to date) is pushed past both despite being the oldest overall.
    expect(headings.indexOf('Independiente Uno')).toBeLessThan(headings.indexOf('Empresa Uno'))
    expect(headings).not.toContain('Independiente Dos')
  })

  it('moves to page 2 to reveal the up-to-date item', async () => {
    const wrapper = mount(ContratosTab)
    await flushPromises()

    const siguienteBtn = wrapper.findAll('button').find((b) => b.text().includes('Siguiente'))
    await siguienteBtn!.trigger('click')
    await flushPromises()

    const text = wrapper.text()
    expect(text).toContain('Independiente Dos')
    expect(text).not.toContain('Empresa Uno')
    expect(text).toContain('Página 2 de 2')
  })

  it('explains that consentimiento informado is independent from Contrato/NDA', async () => {
    const wrapper = mount(ContratosTab)
    await flushPromises()

    expect(wrapper.text()).toContain('trámite personal, independiente del Contrato/NDA')
  })

  it('shows the pending-items alert strip based on the full resumen, not just the visible page', async () => {
    const wrapper = mount(ContratosTab)
    await flushPromises()

    const text = wrapper.text()
    expect(text).toContain('1 contrato pendiente')
    expect(text).toContain('2 NDA pendientes')
    expect(text).toContain('coachees sin consentimiento')
  })

  it('shows "Todo al día" when nothing is pending', async () => {
    vi.mocked(getResumenLegal).mockResolvedValue({
      empresas: [
        {
          empresaId: 'e1',
          nombre: 'Empresa Uno',
          contrato: { estado: 'firmado', fecha: '2026-01-01', vigencia: '2099-01-01', tieneArchivo: true },
          nda: { estado: 'firmado', fecha: '2026-01-01', vigencia: '2099-01-01', tieneArchivo: true },
          coacheesConConsentimiento: 1,
          coacheesTotal: 1,
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ],
      independientes: [],
    })
    vi.mocked(listCoachees).mockResolvedValue([])

    const wrapper = mount(ContratosTab)
    await flushPromises()

    expect(wrapper.text()).toContain('Todo al día')
  })

  it('shows the otros documentos section per empresa, filtered to that empresa', async () => {
    const wrapper = mount(ContratosTab)
    await flushPromises()

    expect(wrapper.text()).toContain('Otros documentos (1)')
  })

  it('toggles consentimiento for a coachee within an empresa card', async () => {
    const wrapper = mount(ContratosTab)
    await flushPromises()

    const toggle = wrapper.findAll('button').find((b) => b.text().includes('coachees con consentimiento'))
    await toggle!.trigger('click')
    await flushPromises()

    const item = wrapper.findAll('li').find((li) => li.text().includes('Coachee Dos'))
    await item!.find('button').trigger('click')

    expect(setConsentimiento).toHaveBeenCalledWith('c2', true)
  })

  it('toggles consentimiento for an independiente directly on its card', async () => {
    const wrapper = mount(ContratosTab)
    await flushPromises()

    const card = wrapper.findAll('h3').find((h) => h.text() === 'Independiente Uno')!.element.closest('.rounded-2xl')!
    const toggleBtn = Array.from(card.querySelectorAll('button')).find((b) =>
      b.textContent?.trim() === 'Marcar como firmado',
    )
    await toggleBtn!.dispatchEvent(new Event('click'))

    expect(setConsentimiento).toHaveBeenCalledWith('c3', true)
  })

  it('sends a consentimiento email request from an independiente card', async () => {
    const wrapper = mount(ContratosTab)
    await flushPromises()

    const card = wrapper.findAll('h3').find((h) => h.text() === 'Independiente Uno')!.element.closest('.rounded-2xl')!
    const enviarBtn = Array.from(card.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Enviar solicitud por correo'),
    )
    await enviarBtn!.dispatchEvent(new Event('click'))
    await flushPromises()

    expect(solicitarConsentimiento).toHaveBeenCalledWith('c3')
    expect(notifySuccess).toHaveBeenCalled()
  })

  it('shows an error toast when sending the consentimiento email request fails', async () => {
    vi.mocked(solicitarConsentimiento).mockRejectedValue(new Error('boom'))
    const wrapper = mount(ContratosTab)
    await flushPromises()

    const card = wrapper.findAll('h3').find((h) => h.text() === 'Independiente Uno')!.element.closest('.rounded-2xl')!
    const enviarBtn = Array.from(card.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Enviar solicitud por correo'),
    )
    await enviarBtn!.dispatchEvent(new Event('click'))
    await flushPromises()

    expect(notifyError).toHaveBeenCalled()
  })
})
