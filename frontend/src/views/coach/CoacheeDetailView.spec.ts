import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import CoacheeDetailView from './CoacheeDetailView.vue'
import type { Coachee } from '../../api/coachees'
import type { PlanDesarrollo } from '../../api/planesDesarrollo'

vi.mock('../../api/coachees', async () => {
  const actual = await vi.importActual<typeof import('../../api/coachees')>('../../api/coachees')
  return { ...actual, getCoachee: vi.fn() }
})
vi.mock('../../api/ciclos', async () => {
  const actual = await vi.importActual<typeof import('../../api/ciclos')>('../../api/ciclos')
  return { ...actual, getCicloActualDeCoachee: vi.fn() }
})
vi.mock('../../api/planesDesarrollo', async () => {
  const actual = await vi.importActual<typeof import('../../api/planesDesarrollo')>('../../api/planesDesarrollo')
  return { ...actual, getPlanByCoachee: vi.fn() }
})

import { getCoachee } from '../../api/coachees'
import { getCicloActualDeCoachee } from '../../api/ciclos'
import { getPlanByCoachee } from '../../api/planesDesarrollo'

const coacheeBase: Coachee = {
  id: 'c1',
  nombre: 'Ana Reagenda',
  empresaId: null,
  empresa: null,
  user: { id: 'u1', email: 'ana@test.com' },
  telefono: '+56 9 1234 5678',
  emailContacto: null,
  consentimientoInformado: true,
  consentimientoFecha: '2026-08-01T00:00:00.000Z',
}

const planBase: PlanDesarrollo = {
  id: 'p1',
  coacheeId: 'c1',
  competenciaId: null,
  competencia: null,
  nivelActual: null,
  nivelObjetivo: null,
  plazo: null,
  descripcionEstadoActual: null,
  objetivoGeneral: null,
  estado: 'aprobado',
  enviadoEn: null,
  comentarioCoach: null,
  habitoCuando: null,
  habitoEnVezDe: null,
  habitoVoyA: null,
  habitoObvio: null,
  habitoSencillo: null,
  habitoAtractivo: null,
  habitoSatisfactorio: null,
  formacionLibros: null,
  formacionArticulos: null,
  formacionVideos: null,
  formacionPodcasts: null,
  formacionPracticaGuiada: null,
  objetivos: [],
  actividades: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
} as PlanDesarrollo

const router = createRouter({
  history: createWebHistory(),
  routes: [{ path: '/coach/coachees', component: { template: '<div />' } }],
})

const stubs = { CicloStepper: true, PerfilTab: true, PlanTab: true, SesionesTab: true, CicloTab: true }

describe('CoacheeDetailView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(getCoachee).mockResolvedValue(coacheeBase)
    vi.mocked(getCicloActualDeCoachee).mockResolvedValue(null)
    vi.mocked(getPlanByCoachee).mockResolvedValue(planBase)
  })

  it('shows an identity summary at a glance: avatar initials, name, empresa, email and phone', async () => {
    const wrapper = mount(CoacheeDetailView, { props: { coacheeId: 'c1' }, global: { plugins: [router], stubs } })
    await flushPromises()

    expect(wrapper.text()).toContain('AR') // iniciales de "Ana Reagenda"
    expect(wrapper.text()).toContain('Ana Reagenda')
    expect(wrapper.text()).toContain('Independiente')
    expect(wrapper.text()).toContain('ana@test.com')
    expect(wrapper.text()).toContain('+56 9 1234 5678')
  })

  it('shows the empresa name instead of "Independiente" when the coachee belongs to one', async () => {
    vi.mocked(getCoachee).mockResolvedValue({ ...coacheeBase, empresaId: 'e1', empresa: { id: 'e1', nombre: 'Andes Minerals' } })

    const wrapper = mount(CoacheeDetailView, { props: { coacheeId: 'c1' }, global: { plugins: [router], stubs } })
    await flushPromises()

    expect(wrapper.text()).toContain('Andes Minerals')
    expect(wrapper.text()).not.toContain('Independiente')
  })

  it('shows a dash for missing email/phone instead of leaving it blank', async () => {
    vi.mocked(getCoachee).mockResolvedValue({ ...coacheeBase, user: null, telefono: null })

    const wrapper = mount(CoacheeDetailView, { props: { coacheeId: 'c1' }, global: { plugins: [router], stubs } })
    await flushPromises()

    const text = wrapper.text()
    expect(text).toContain('—')
  })

  it('shows the plan estado as a colored badge, matching the estado label', async () => {
    vi.mocked(getPlanByCoachee).mockResolvedValue({ ...planBase, estado: 'cambios_solicitados' })

    const wrapper = mount(CoacheeDetailView, { props: { coacheeId: 'c1' }, global: { plugins: [router], stubs } })
    await flushPromises()

    expect(wrapper.text()).toContain('Cambios solicitados al plan')
  })

  it('shows consentimiento pendiente in a distinct badge from firmado', async () => {
    vi.mocked(getCoachee).mockResolvedValue({ ...coacheeBase, consentimientoInformado: false, consentimientoFecha: null })

    const wrapper = mount(CoacheeDetailView, { props: { coacheeId: 'c1' }, global: { plugins: [router], stubs } })
    await flushPromises()

    expect(wrapper.text()).toContain('Consentimiento pendiente')
    expect(wrapper.text()).not.toContain('Consentimiento firmado')
  })
})
