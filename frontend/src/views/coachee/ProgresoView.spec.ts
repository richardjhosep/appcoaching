import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises, DOMWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import ProgresoView from './ProgresoView.vue'
import type { Ciclo } from '../../api/ciclos'
import type { Coachee } from '../../api/coachees'
import type { PlanDesarrollo } from '../../api/planesDesarrollo'

vi.mock('../../api/seguimiento', async () => {
  const actual = await vi.importActual<typeof import('../../api/seguimiento')>('../../api/seguimiento')
  return {
    ...actual,
    getMiAvance: vi.fn(),
    getMiLineaProgreso: vi.fn(),
    getMisLogros: vi.fn(),
    getMisEntradasDiario: vi.fn(),
  }
})
vi.mock('../../api/ciclos', async () => {
  const actual = await vi.importActual<typeof import('../../api/ciclos')>('../../api/ciclos')
  return { ...actual, getMisCiclos: vi.fn() }
})
vi.mock('../../api/coachees', async () => {
  const actual = await vi.importActual<typeof import('../../api/coachees')>('../../api/coachees')
  return { ...actual, getMyCoachee: vi.fn() }
})
vi.mock('../../api/planesDesarrollo', async () => {
  const actual = await vi.importActual<typeof import('../../api/planesDesarrollo')>('../../api/planesDesarrollo')
  return { ...actual, getOwnPlan: vi.fn() }
})
vi.mock('../../api/retroalimentacion', async () => {
  const actual = await vi.importActual<typeof import('../../api/retroalimentacion')>('../../api/retroalimentacion')
  return { ...actual, getMisRetroalimentaciones: vi.fn() }
})

import { getMiAvance, getMiLineaProgreso, getMisLogros, getMisEntradasDiario } from '../../api/seguimiento'
import { getMisCiclos } from '../../api/ciclos'
import { getMyCoachee } from '../../api/coachees'
import { getOwnPlan } from '../../api/planesDesarrollo'
import { getMisRetroalimentaciones } from '../../api/retroalimentacion'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/coachee/progreso', name: 'coachee-progreso', component: { template: '<div />' } },
    { path: '/coachee/ciclos/:cicloId/certificado', name: 'coachee-certificado', component: { template: '<div />' } },
  ],
})

const cicloCerrado: Ciclo = {
  id: 'c1',
  coacheeId: 'coachee-1',
  totalSesiones: 10,
  fechaApertura: '2026-01-01T00:00:00.000Z',
  fechaCierre: '2026-03-01T00:00:00.000Z',
  resultado: 'logrado',
  resumenReunionInicial: null,
  informeFinal: null,
  informePdfNombre: null,
  informePdfPath: null,
  sesionesRealizadas: 10,
  sesionesRestantes: 0,
  alertaPorVencer: false,
}

const coachee: Coachee = {
  id: 'coachee-1',
  nombre: 'Felipe Cortes',
  empresaId: null,
  telefono: null,
  emailContacto: null,
  consentimientoInformado: true,
  consentimientoFecha: null,
}

const plan: PlanDesarrollo = {
  id: 'plan-1',
  coacheeId: 'coachee-1',
  competenciaId: 'comp-1',
  nivelActual: null,
  nivelObjetivo: null,
  plazo: null,
  descripcionEstadoActual: null,
  objetivoGeneral: 'Impacto e Influencia',
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

async function mountView(ciclos: Ciclo[] = []) {
  vi.mocked(getMiAvance).mockResolvedValue({ avance: 50 })
  vi.mocked(getMiLineaProgreso).mockResolvedValue([])
  vi.mocked(getMisLogros).mockResolvedValue([])
  vi.mocked(getMisEntradasDiario).mockResolvedValue([])
  vi.mocked(getMisCiclos).mockResolvedValue(ciclos)
  vi.mocked(getMyCoachee).mockResolvedValue(coachee)
  vi.mocked(getOwnPlan).mockResolvedValue(plan)
  vi.mocked(getMisRetroalimentaciones).mockResolvedValue([])

  const wrapper = mount(ProgresoView, { global: { plugins: [router] } })
  await flushPromises()
  return wrapper
}

describe('ProgresoView — Certificados', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('does not show the Certificados section when there are no closed cycles with resultado', async () => {
    const wrapper = await mountView([])

    expect(wrapper.text()).not.toContain('Certificados')
  })

  it('shows a certificate card with the resultado badge instead of a bare link', async () => {
    const wrapper = await mountView([cicloCerrado])

    expect(wrapper.text()).toContain('Certificado de finalización')
    expect(wrapper.text()).toContain('Logrado')
    expect(wrapper.find('a.underline').exists()).toBe(false)
  })

  it('opens a preview modal with the certificate data when "Vista previa" is clicked', async () => {
    const wrapper = await mountView([cicloCerrado])

    const previewBtn = wrapper.findAll('button').find((b) => b.text() === 'Vista previa')
    expect(previewBtn).toBeTruthy()
    await previewBtn!.trigger('click')
    await flushPromises()

    const modal = new DOMWrapper(document.body)
    expect(modal.text()).toContain('Vista previa del certificado')
    expect(modal.text()).toContain('Felipe Cortes')
    expect(modal.text()).toContain('Impacto e Influencia')
  })

  it('links "Descargar" to the full certificate page for the right ciclo', async () => {
    const wrapper = await mountView([cicloCerrado])

    const descargarLink = wrapper.findAll('a').find((a) => a.text() === 'Descargar')
    expect(descargarLink?.attributes('href')).toBe('/coachee/ciclos/c1/certificado')
  })
})
