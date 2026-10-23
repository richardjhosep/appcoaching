import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import PlanDesarrolloView from './PlanDesarrolloView.vue'

vi.mock('../../api/planesDesarrollo', async () => {
  const actual = await vi.importActual<typeof import('../../api/planesDesarrollo')>('../../api/planesDesarrollo')
  return { ...actual, getOwnPlan: vi.fn() }
})
vi.mock('../../api/competencias', async () => {
  const actual = await vi.importActual<typeof import('../../api/competencias')>('../../api/competencias')
  return { ...actual, listCompetenciasParaMiPlan: vi.fn() }
})
vi.mock('../../api/ciclos', async () => {
  const actual = await vi.importActual<typeof import('../../api/ciclos')>('../../api/ciclos')
  return { ...actual, getMiCicloActual: vi.fn() }
})
vi.mock('../../api/coachees', async () => {
  const actual = await vi.importActual<typeof import('../../api/coachees')>('../../api/coachees')
  return { ...actual, getMisCompetenciasEmpresa: vi.fn() }
})

import { getOwnPlan } from '../../api/planesDesarrollo'
import { listCompetenciasParaMiPlan } from '../../api/competencias'
import { getMiCicloActual } from '../../api/ciclos'
import { getMisCompetenciasEmpresa } from '../../api/coachees'

const stubs = {
  CicloStepper: true,
  DefinicionTab: { template: '<div data-test="definicion" />' },
  HabitoEjecucionTab: { template: '<div data-test="habito" />' },
  FormacionTab: { template: '<div data-test="formacion" />' },
}

describe('PlanDesarrolloView (coachee)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(getOwnPlan).mockResolvedValue({ id: 'p1', estado: 'sin_enviar', updatedAt: '2026-01-01T00:00:00.000Z', competencia: null } as never)
    vi.mocked(listCompetenciasParaMiPlan).mockResolvedValue([])
    vi.mocked(getMiCicloActual).mockResolvedValue(null)
    vi.mocked(getMisCompetenciasEmpresa).mockResolvedValue([])
  })

  it('renders the sections as an accessible tablist and switches between them', async () => {
    const wrapper = mount(PlanDesarrolloView, { global: { stubs } })
    await flushPromises()

    expect(wrapper.find('[role="tablist"]').exists()).toBe(true)
    const tabs = wrapper.findAll('[role="tab"]')
    expect(tabs.map((t) => t.text())).toEqual(['Definición', 'Hábito y ejecución', 'Formación'])
    expect(tabs[0].attributes('aria-selected')).toBe('true')
    expect(wrapper.find('[data-test="definicion"]').exists()).toBe(true)

    await tabs[1].trigger('click')
    expect(wrapper.find('[data-test="habito"]').exists()).toBe(true)
    expect(wrapper.findAll('[role="tab"]')[1].attributes('aria-selected')).toBe('true')
  })

  it('shows an error state with retry when the plan fails to load', async () => {
    vi.mocked(getOwnPlan).mockRejectedValueOnce(new Error('plan caído'))

    const wrapper = mount(PlanDesarrolloView, { global: { stubs } })
    await flushPromises()
    expect(wrapper.find('[role="alert"]').text()).toContain('plan caído')

    await wrapper.findAll('button').find((b) => b.text() === 'Reintentar')!.trigger('click')
    await flushPromises()
    expect(wrapper.find('[role="tablist"]').exists()).toBe(true)
  })
})
