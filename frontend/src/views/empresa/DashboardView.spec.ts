import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import DashboardView from './DashboardView.vue'
import type { CoacheeListItem } from '../../api/coachees'
import type { Ciclo } from '../../api/ciclos'
import type { Empresa } from '../../api/empresas'
import type { KpisEmpresa } from '../../api/satisfaccion'

vi.mock('../../api/satisfaccion', async () => {
  const actual = await vi.importActual<typeof import('../../api/satisfaccion')>('../../api/satisfaccion')
  return { ...actual, getMisKpis: vi.fn() }
})
vi.mock('../../api/empresas', async () => {
  const actual = await vi.importActual<typeof import('../../api/empresas')>('../../api/empresas')
  return { ...actual, getMyEmpresa: vi.fn() }
})
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

import { getMisKpis } from '../../api/satisfaccion'
import { getMyEmpresa } from '../../api/empresas'
import { listCoachees } from '../../api/coachees'
import { getPlanByCoachee } from '../../api/planesDesarrollo'
import { getCiclosDeCoachee } from '../../api/ciclos'
import { getAvanceDeCoachee } from '../../api/seguimiento'
import { getProximaSesionDeCoachee } from '../../api/sesiones'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/empresa/dashboard', name: 'empresa-dashboard', component: { template: '<div />' } },
    { path: '/empresa/coachees/:coacheeId/ciclo', name: 'empresa-ciclo', component: { template: '<div />' } },
  ],
})

const kpis: KpisEmpresa = {
  procesosTerminados: 2,
  procesosEnCurso: 1,
  tasaAsistencia: 80,
  satisfaccionPromedio: 4.5,
}

const empresa: Empresa = {
  id: 'empresa-1',
  nombre: 'QA Empresa Verify',
  tarifaHora: 1000,
  isActive: true,
  pagada: false,
  horasContratadas: 40,
}

const coachee: CoacheeListItem = {
  id: 'coachee-1',
  nombre: 'QA Paleta Verify',
  empresaId: 'empresa-1',
  consentimientoInformado: true,
  consentimientoFecha: null,
}

const cicloPorVencer: Ciclo = {
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
  sesionesRealizadas: 9,
  sesionesRestantes: 1,
  alertaPorVencer: true,
}

async function mountView() {
  const wrapper = mount(DashboardView, { global: { plugins: [router] } })
  await flushPromises()
  return wrapper
}

describe('DashboardView (empresa)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(getMisKpis).mockResolvedValue(kpis)
    vi.mocked(getMyEmpresa).mockResolvedValue(empresa)
    vi.mocked(getPlanByCoachee).mockResolvedValue(null as never)
    vi.mocked(getAvanceDeCoachee).mockResolvedValue({ avance: null })
    vi.mocked(getProximaSesionDeCoachee).mockResolvedValue(null)
  })

  it('shows the KPI cards and the contract info', async () => {
    vi.mocked(listCoachees).mockResolvedValue([])

    const wrapper = await mountView()

    expect(wrapper.text()).toContain('80%')
    expect(wrapper.text()).toContain('4.5 ★')
    expect(wrapper.text()).toContain('40')
    expect(wrapper.text()).toContain('Pendiente')
  })

  it('shows an empty state when nothing needs attention', async () => {
    vi.mocked(listCoachees).mockResolvedValue([])

    const wrapper = await mountView()

    expect(wrapper.text()).toContain('Todo al día')
  })

  it('lists a coachee whose current cycle is about to expire', async () => {
    vi.mocked(listCoachees).mockResolvedValue([coachee])
    vi.mocked(getCiclosDeCoachee).mockResolvedValue([cicloPorVencer])

    const wrapper = await mountView()

    expect(wrapper.text()).toContain('QA Paleta Verify')
    expect(wrapper.text()).toContain('Ciclo por vencer')
  })
})
