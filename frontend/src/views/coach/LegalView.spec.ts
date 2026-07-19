import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import LegalView from './LegalView.vue'
import type { EmpresaLegal, MedidaCumplimiento } from '../../api/legal'
import type { CoacheeListItem } from '../../api/coachees'

vi.mock('../../api/legal', async () => {
  const actual = await vi.importActual<typeof import('../../api/legal')>('../../api/legal')
  return {
    ...actual,
    getResumenLegal: vi.fn(),
    getCumplimiento: vi.fn(),
    upsertDocumentoLegal: vi.fn(),
  }
})
vi.mock('../../api/coachees', async () => {
  const actual = await vi.importActual<typeof import('../../api/coachees')>('../../api/coachees')
  return { ...actual, listCoachees: vi.fn(), setConsentimiento: vi.fn() }
})

import { getResumenLegal, getCumplimiento } from '../../api/legal'
import { listCoachees } from '../../api/coachees'

const resumen: EmpresaLegal[] = [
  {
    empresaId: 'e1',
    nombre: 'Empresa Uno',
    contrato: { estado: 'firmado', fecha: '2026-01-01', vigencia: '2027-01-01' },
    nda: { estado: 'pendiente', fecha: null, vigencia: null },
    coacheesConConsentimiento: 1,
    coacheesTotal: 2,
  },
]

const cumplimiento: MedidaCumplimiento[] = [
  { id: 'notas_privadas', descripcion: 'Las notas privadas nunca son visibles.', activa: true },
  { id: 'consentimiento_informado', descripcion: '1 de 2 coachees.', activa: false },
]

const coachees: CoacheeListItem[] = [
  { id: 'c1', nombre: 'Coachee Uno', empresaId: 'e1', consentimientoInformado: true, consentimientoFecha: '2026-01-01' },
  { id: 'c2', nombre: 'Coachee Dos', empresaId: 'e1', consentimientoInformado: false, consentimientoFecha: null },
  { id: 'c3', nombre: 'Independiente Uno', empresaId: null, consentimientoInformado: false, consentimientoFecha: null },
]

describe('LegalView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(getResumenLegal).mockResolvedValue(resumen)
    vi.mocked(getCumplimiento).mockResolvedValue(cumplimiento)
    vi.mocked(listCoachees).mockResolvedValue(coachees)
  })

  it('shows contrato/NDA state and the consentimiento count per empresa', async () => {
    const wrapper = mount(LegalView)
    await flushPromises()

    expect(wrapper.text()).toContain('Empresa Uno')
    expect(wrapper.text()).toContain('Consentimiento informado: 1 de 2')
    const select = wrapper.find('select')
    expect((select.element as HTMLSelectElement).value).toBe('firmado')
  })

  it('lists coachees scoped to their empresa, plus a separate independientes section', async () => {
    const wrapper = mount(LegalView)
    await flushPromises()

    expect(wrapper.text()).toContain('Coachee Uno')
    expect(wrapper.text()).toContain('Coachee Dos')
    expect(wrapper.text()).toContain('Independientes')
    expect(wrapper.text()).toContain('Independiente Uno')
  })

  it('renders the cumplimiento checklist with active/inactive markers', async () => {
    const wrapper = mount(LegalView)
    await flushPromises()

    expect(wrapper.text()).toContain('Panel de cumplimiento LPDP')
    expect(wrapper.text()).toContain('Las notas privadas nunca son visibles.')
  })
})
