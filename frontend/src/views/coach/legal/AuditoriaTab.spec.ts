import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import AuditoriaTab from './AuditoriaTab.vue'
import type { AuditLog } from '../../../api/audit'
import type { CoacheeListItem } from '../../../api/coachees'
import type { Empresa } from '../../../api/empresas'

vi.mock('../../../api/audit', async () => {
  const actual = await vi.importActual<typeof import('../../../api/audit')>('../../../api/audit')
  return { ...actual, getAuditLog: vi.fn() }
})
vi.mock('../../../api/coachees', async () => {
  const actual = await vi.importActual<typeof import('../../../api/coachees')>('../../../api/coachees')
  return { ...actual, listCoachees: vi.fn() }
})
vi.mock('../../../api/empresas', async () => {
  const actual = await vi.importActual<typeof import('../../../api/empresas')>('../../../api/empresas')
  return { ...actual, listEmpresas: vi.fn() }
})

import { getAuditLog } from '../../../api/audit'
import { listCoachees } from '../../../api/coachees'
import { listEmpresas } from '../../../api/empresas'

const coachees: CoacheeListItem[] = [
  { id: 'c1', nombre: 'Rodrigo Peña', empresaId: null, consentimientoInformado: true, consentimientoFecha: null },
]
const empresas: Empresa[] = [
  { id: 'e1', nombre: 'Andes Minerals', tarifaHora: 50000, isActive: true, pagada: true, horasContratadas: null, fechaInicio: null, fechaFin: null },
]

const logs: AuditLog[] = [
  {
    id: 'log-1',
    userId: 'u-coach',
    action: 'PLAN_APROBADO',
    targetType: 'Coachee',
    targetId: 'c1',
    actorLabel: 'Coach (coach@test.com)',
    targetLabel: 'Rodrigo Peña',
    metadata: null,
    createdAt: '2026-07-10T09:12:00.000Z',
  },
]

const logSesion: AuditLog = {
  id: 'log-2',
  userId: 'u-coach',
  action: 'LOGIN_SUCCESS',
  targetType: null,
  targetId: null,
  actorLabel: 'Coach (coach@test.com)',
  targetLabel: null,
  metadata: null,
  createdAt: '2026-07-10T08:00:00.000Z',
}

describe('AuditoriaTab', () => {
  beforeEach(() => {
    vi.mocked(getAuditLog).mockResolvedValue(logs)
    vi.mocked(listCoachees).mockResolvedValue(coachees)
    vi.mocked(listEmpresas).mockResolvedValue(empresas)
  })

  it('shows a natural-language entry with actor and target names, never raw enums or UUIDs', async () => {
    const wrapper = mount(AuditoriaTab)
    await flushPromises()

    const text = wrapper.text()
    expect(text).toContain('Coach (coach@test.com)')
    expect(text).toContain('Aprobó el plan de desarrollo de Rodrigo Peña.')
    expect(text).not.toContain('PLAN_APROBADO')
    expect(text).not.toContain('c1')
  })

  it('loads by default with scope=coaching and no target/date filters, excluding app/security noise', async () => {
    mount(AuditoriaTab)
    await flushPromises()

    expect(getAuditLog).toHaveBeenCalledWith({
      scope: 'coaching',
      targetId: undefined,
      desde: undefined,
      hasta: undefined,
    })
  })

  it('flags entries from before the actor/target were captured, instead of a bare dash or "Sistema"', async () => {
    vi.mocked(getAuditLog).mockResolvedValue([
      {
        id: 'log-legacy',
        userId: 'u-deleted',
        action: 'COACHEE_ELIMINADO',
        targetType: 'Coachee',
        targetId: 'c-deleted',
        actorLabel: null,
        targetLabel: null,
        metadata: null,
        createdAt: '2026-08-01T22:24:38.000Z',
      },
    ])

    const wrapper = mount(AuditoriaTab)
    await flushPromises()

    const text = wrapper.text()
    expect(text).toContain('Actor no disponible')
    expect(text).toContain('Eliminó al coachee (nombre no disponible).')
    expect(text).toContain('registro antiguo')
    expect(text).not.toContain('Sistema')
  })

  it('shows a muted message when there is no activity yet', async () => {
    vi.mocked(getAuditLog).mockResolvedValue([])

    const wrapper = mount(AuditoriaTab)
    await flushPromises()

    expect(wrapper.text()).toContain('Todavía no hay actividad registrada')
  })

  it('reveals account activity (logins, etc.) only after clicking the toggle', async () => {
    const wrapper = mount(AuditoriaTab)
    await flushPromises()

    expect(wrapper.text()).not.toContain('Inició sesión')

    vi.mocked(getAuditLog).mockResolvedValue([logSesion])
    const toggleBtn = wrapper.findAll('button').find((b) => b.text().includes('Mostrar también'))
    await toggleBtn!.trigger('click')
    await flushPromises()

    expect(getAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ scope: 'todo' }),
    )
    expect(wrapper.text()).toContain('Inició sesión')
    expect(wrapper.text()).toContain('Ocultar actividad de la cuenta')
  })

  it('lists empresas and coachees in the target select, populated from the API', async () => {
    const wrapper = mount(AuditoriaTab)
    await flushPromises()

    expect(wrapper.text()).toContain('Andes Minerals')
    expect(wrapper.text()).toContain('Rodrigo Peña')
  })

  it('filters by the selected empresa/coachee targetId', async () => {
    const wrapper = mount(AuditoriaTab)
    await flushPromises()

    await wrapper.find('select').setValue('c1')
    await flushPromises()

    expect(getAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ targetId: 'c1' }),
    )
  })

  it('filters by a desde/hasta date range', async () => {
    const wrapper = mount(AuditoriaTab)
    await flushPromises()

    const [desdeInput, hastaInput] = wrapper.findAll('input[type="date"]')
    await desdeInput!.setValue('2026-08-01')
    await hastaInput!.setValue('2026-08-05')
    await flushPromises()

    expect(getAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ desde: '2026-08-01', hasta: '2026-08-05' }),
    )
  })

  it('shows "Limpiar filtros" only once a filter is set, and it resets the list', async () => {
    const wrapper = mount(AuditoriaTab)
    await flushPromises()

    expect(wrapper.text()).not.toContain('Limpiar filtros')

    await wrapper.find('select').setValue('c1')
    await flushPromises()
    expect(wrapper.text()).toContain('Limpiar filtros')

    const limpiarBtn = wrapper.findAll('button').find((b) => b.text() === 'Limpiar filtros')
    await limpiarBtn!.trigger('click')
    await flushPromises()

    expect(getAuditLog).toHaveBeenLastCalledWith(
      expect.objectContaining({ targetId: undefined, desde: undefined, hasta: undefined }),
    )
    expect(wrapper.text()).not.toContain('Limpiar filtros')
  })
})
