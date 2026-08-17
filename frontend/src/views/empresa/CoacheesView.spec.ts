import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import CoacheesView from './CoacheesView.vue'
import type { CoacheeListItem } from '../../api/coachees'
import type { Ciclo } from '../../api/ciclos'
import type { PlanDesarrollo } from '../../api/planesDesarrollo'

vi.mock('../../api/coachees', async () => {
  const actual = await vi.importActual<typeof import('../../api/coachees')>('../../api/coachees')
  return { ...actual, listCoachees: vi.fn() }
})
vi.mock('../../api/planesDesarrollo', async () => {
  const actual = await vi.importActual<typeof import('../../api/planesDesarrollo')>('../../api/planesDesarrollo')
  return { ...actual, getPlanByCoachee: vi.fn() }
})
vi.mock('../../api/ciclos', async () => {
  const actual = await vi.importActual<typeof import('../../api/ciclos')>('../../api/ciclos')
  return { ...actual, getCiclosDeCoachee: vi.fn() }
})
vi.mock('../../api/seguimiento', async () => {
  const actual = await vi.importActual<typeof import('../../api/seguimiento')>('../../api/seguimiento')
  return { ...actual, getAvanceDeCoachee: vi.fn() }
})
vi.mock('../../api/sesiones', async () => {
  const actual = await vi.importActual<typeof import('../../api/sesiones')>('../../api/sesiones')
  return { ...actual, getProximaSesionDeCoachee: vi.fn() }
})

import { listCoachees } from '../../api/coachees'
import { getPlanByCoachee } from '../../api/planesDesarrollo'
import { getCiclosDeCoachee } from '../../api/ciclos'
import { getAvanceDeCoachee } from '../../api/seguimiento'
import { getProximaSesionDeCoachee } from '../../api/sesiones'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/empresa/coachees', name: 'empresa-coachees', component: { template: '<div />' } },
    { path: '/empresa/coachees/:coacheeId/ciclo', name: 'empresa-ciclo', component: { template: '<div />' } },
  ],
})

const coachee: CoacheeListItem = {
  id: 'coachee-1',
  nombre: 'QA Paleta Verify',
  empresaId: 'empresa-1',
  consentimientoInformado: true,
  consentimientoFecha: null,
}

const cicloAbierto: Ciclo = {
  id: 'c1',
  coacheeId: 'coachee-1',
  totalSesiones: 10,
  fechaApertura: '2026-01-01T00:00:00.000Z',
  fechaCierre: null,
  resultado: null,
  resumenReunionInicial: null,
  informeFinal: null,
  informePdfNombre: null,
  informePdfPath: null,
  sesionesRealizadas: 3,
  sesionesRestantes: 7,
  alertaPorVencer: false,
}

const plan = {
  id: 'plan-1',
  coacheeId: 'coachee-1',
  competencia: { id: 'comp-1', nombre: 'Comunicación' },
} as PlanDesarrollo

describe('CoacheesView (empresa)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('shows an empty state when the empresa has no coachees', async () => {
    vi.mocked(listCoachees).mockResolvedValue([])

    const wrapper = mount(CoacheesView, { global: { plugins: [router] } })
    await flushPromises()

    expect(wrapper.text()).toContain('Todavía no hay coachees asociados a tu empresa')
  })

  it('shows competencia, estado and avance for each coachee', async () => {
    vi.mocked(listCoachees).mockResolvedValue([coachee])
    vi.mocked(getPlanByCoachee).mockResolvedValue(plan)
    vi.mocked(getCiclosDeCoachee).mockResolvedValue([cicloAbierto])
    vi.mocked(getAvanceDeCoachee).mockResolvedValue({ avance: 65 })
    vi.mocked(getProximaSesionDeCoachee).mockResolvedValue(null)

    const wrapper = mount(CoacheesView, { global: { plugins: [router] } })
    await flushPromises()

    expect(wrapper.text()).toContain('QA Paleta Verify')
    expect(wrapper.text()).toContain('Comunicación')
    expect(wrapper.text()).toContain('En curso')
    expect(wrapper.text()).toContain('65% de avance')
  })
})
