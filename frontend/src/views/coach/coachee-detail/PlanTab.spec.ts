import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import PlanTab from './PlanTab.vue'
import type { PlanDesarrollo } from '../../../api/planesDesarrollo'

vi.mock('../../../api/planesDesarrollo', async () => {
  const actual = await vi.importActual<typeof import('../../../api/planesDesarrollo')>('../../../api/planesDesarrollo')
  return { ...actual, getPlanByCoachee: vi.fn(), setTrabajarNiveles: vi.fn(), asignarCompetencia: vi.fn(), solicitarCambios: vi.fn() }
})
vi.mock('../../../api/seguimiento', () => ({ getAutoevaluacionesDeCoachee: vi.fn().mockResolvedValue([]) }))
vi.mock('../../../api/competencias', () => ({ listCompetenciasParaCoachee: vi.fn().mockResolvedValue([]) }))
vi.mock('../../../lib/notify', () => ({ notifySuccess: vi.fn(), notifyError: vi.fn() }))

import { getPlanByCoachee, setTrabajarNiveles } from '../../../api/planesDesarrollo'

const plan = {
  id: 'p1',
  coacheeId: 'c1',
  competenciaId: null,
  competencia: null,
  nivelActual: null,
  nivelObjetivo: null,
  trabajarNiveles: false,
  plazo: null,
  descripcionEstadoActual: null,
  objetivoGeneral: null,
  estado: 'aprobado',
  objetivos: [],
  actividades: [],
} as unknown as PlanDesarrollo

describe('PlanTab', () => {
  beforeEach(() => {
    vi.mocked(getPlanByCoachee).mockResolvedValue(plan)
  })

  it('hides the nivel tiles when the plan does not work with niveles, and lets the coach turn them on', async () => {
    vi.mocked(setTrabajarNiveles).mockResolvedValue({ ...plan, trabajarNiveles: true })
    const wrapper = mount(PlanTab, { props: { coacheeId: 'c1' } })
    await flushPromises()

    expect(wrapper.text()).not.toContain('Nivel objetivo')
    const toggle = wrapper.find('input[type="checkbox"]')
    expect((toggle.element as HTMLInputElement).checked).toBe(false)

    await toggle.setValue(true)
    await flushPromises()

    expect(setTrabajarNiveles).toHaveBeenCalledWith('c1', true)
    expect(wrapper.text()).toContain('Nivel objetivo')
  })
})
