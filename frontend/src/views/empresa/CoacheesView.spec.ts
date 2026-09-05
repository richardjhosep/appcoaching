import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises, DOMWrapper } from '@vue/test-utils'
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
vi.mock('../../api/retroalimentacion', async () => {
  const actual = await vi.importActual<typeof import('../../api/retroalimentacion')>('../../api/retroalimentacion')
  return { ...actual, getRetroalimentacionesDeCoachee: vi.fn() }
})

import { listCoachees } from '../../api/coachees'
import { getPlanByCoachee } from '../../api/planesDesarrollo'
import { getCiclosDeCoachee } from '../../api/ciclos'
import { getAvanceDeCoachee } from '../../api/seguimiento'
import { getProximaSesionDeCoachee } from '../../api/sesiones'
import { getRetroalimentacionesDeCoachee } from '../../api/retroalimentacion'
import type { RetroalimentacionCierre } from '../../api/retroalimentacion'

function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/empresa/coachees', name: 'empresa-coachees', component: { template: '<div />' } },
      {
        path: '/empresa/coachees/:coacheeId/ciclos/:cicloId/certificado',
        name: 'empresa-certificado',
        component: { template: '<div />' },
      },
    ],
  })
}

const coacheeActivo: CoacheeListItem = {
  id: 'coachee-1',
  nombre: 'QA Paleta Verify',
  empresaId: 'empresa-1',
  consentimientoInformado: true,
  consentimientoFecha: null,
}

const coacheeCerrado: CoacheeListItem = {
  id: 'coachee-2',
  nombre: 'QA Coachee B',
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
  resumenReunionInicial: 'Reunión inicial.',
  informeFinal: null,
  impactoNegocio: null,
  informePdfNombre: null,
  informePdfPath: null,
  sesionesRealizadas: 3,
  sesionesRestantes: 7,
  alertaPorVencer: false,
}

const cicloCerrado: Ciclo = {
  id: 'c2',
  coacheeId: 'coachee-2',
  totalSesiones: 10,
  fechaApertura: '2026-01-01T00:00:00.000Z',
  fechaCierre: '2026-03-01T00:00:00.000Z',
  resultado: 'logrado',
  resumenReunionInicial: null,
  informeFinal: null,
  impactoNegocio: 'Redujo el tiempo de entrega del área en 20%.',
  informePdfNombre: null,
  informePdfPath: null,
  sesionesRealizadas: 10,
  sesionesRestantes: 0,
  alertaPorVencer: false,
}

const plan = {
  id: 'plan-1',
  coacheeId: 'coachee-1',
  competencia: { id: 'comp-1', nombre: 'Comunicación' },
  objetivoGeneral: 'Fortalecer la comunicación',
} as PlanDesarrollo

async function mountView(router = makeRouter()) {
  const wrapper = mount(CoacheesView, { global: { plugins: [router] } })
  await flushPromises()
  return wrapper
}

describe('CoacheesView (empresa)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(getPlanByCoachee).mockResolvedValue(plan)
    vi.mocked(getAvanceDeCoachee).mockResolvedValue({ avance: null })
    vi.mocked(getProximaSesionDeCoachee).mockResolvedValue(null)
    vi.mocked(getRetroalimentacionesDeCoachee).mockResolvedValue([])
  })

  it('shows an empty state when the empresa has no coachees', async () => {
    vi.mocked(listCoachees).mockResolvedValue([])

    const wrapper = await mountView()

    expect(wrapper.text()).toContain('Todavía no hay coachees asociados a tu empresa')
  })

  it('lists active coachees in the "Activos" tab by default, with avance and competencia', async () => {
    vi.mocked(listCoachees).mockResolvedValue([coacheeActivo])
    vi.mocked(getCiclosDeCoachee).mockResolvedValue([cicloAbierto])
    vi.mocked(getAvanceDeCoachee).mockResolvedValue({ avance: 65 })

    const wrapper = await mountView()

    expect(wrapper.text()).toContain('Activos')
    expect(wrapper.text()).toContain('QA Paleta Verify')
    expect(wrapper.text()).toContain('Comunicación')
    expect(wrapper.text()).toContain('65%')
    expect(wrapper.text()).toContain('3 / 10')
  })

  it('flags an active coachee with no próxima sesión agendada', async () => {
    vi.mocked(listCoachees).mockResolvedValue([coacheeActivo])
    vi.mocked(getCiclosDeCoachee).mockResolvedValue([cicloAbierto])
    vi.mocked(getProximaSesionDeCoachee).mockResolvedValue(null)

    const wrapper = await mountView()

    expect(wrapper.text()).toContain('Sin sesión agendada')
  })

  it('does not flag an active coachee once a próxima sesión is agendada', async () => {
    vi.mocked(listCoachees).mockResolvedValue([coacheeActivo])
    vi.mocked(getCiclosDeCoachee).mockResolvedValue([cicloAbierto])
    vi.mocked(getProximaSesionDeCoachee).mockResolvedValue({
      id: 's1',
      coacheeId: 'coachee-1',
      fechaHora: '2026-09-10T10:00:00.000Z',
      linkVideollamada: null,
      resumenCompartido: null,
      confirmada: false,
      postSesion: null,
    })

    const wrapper = await mountView()

    expect(wrapper.text()).not.toContain('Sin sesión agendada')
  })

  it('separates a closed-process coachee into the "Procesos cerrados" tab', async () => {
    vi.mocked(listCoachees).mockResolvedValue([coacheeActivo, coacheeCerrado])
    vi.mocked(getCiclosDeCoachee).mockImplementation((coacheeId: string) =>
      Promise.resolve(coacheeId === 'coachee-1' ? [cicloAbierto] : [cicloCerrado]),
    )

    const wrapper = await mountView()

    // Activo por defecto: solo aparece el coachee con ciclo abierto.
    expect(wrapper.text()).toContain('QA Paleta Verify')
    expect(wrapper.text()).not.toContain('QA Coachee B')

    const tabCerrados = wrapper.findAll('button').find((b) => b.text().includes('Procesos cerrados'))
    await tabCerrados!.trigger('click')

    expect(wrapper.text()).not.toContain('QA Paleta Verify')
    expect(wrapper.text()).toContain('QA Coachee B')
    expect(wrapper.text()).toContain('Logrado')
    expect(wrapper.text()).toContain('Redujo el tiempo de entrega del área en 20%.')
  })

  it('opens the progreso modal for an active coachee', async () => {
    vi.mocked(listCoachees).mockResolvedValue([coacheeActivo])
    vi.mocked(getCiclosDeCoachee).mockResolvedValue([cicloAbierto])
    vi.mocked(getAvanceDeCoachee).mockResolvedValue({ avance: 65 })

    const wrapper = await mountView()
    const verProgresoBtn = wrapper.findAll('button').find((b) => b.text() === 'Ver progreso')
    await verProgresoBtn!.trigger('click')
    await flushPromises()

    const modal = new DOMWrapper(document.body)
    expect(modal.text()).toContain('QA Paleta Verify')
    expect(modal.text()).toContain('Reunión inicial.')
  })

  it('opens the historial modal for a closed-process coachee', async () => {
    vi.mocked(listCoachees).mockResolvedValue([coacheeCerrado])
    vi.mocked(getCiclosDeCoachee).mockResolvedValue([cicloCerrado])

    const wrapper = await mountView()
    const tabCerrados = wrapper.findAll('button').find((b) => b.text().includes('Procesos cerrados'))
    await tabCerrados!.trigger('click')

    const historialBtn = wrapper.findAll('button').find((b) => b.text() === 'Historial')
    await historialBtn!.trigger('click')
    await flushPromises()

    const modal = new DOMWrapper(document.body)
    expect(modal.text()).toContain('Historial de ciclos')
  })

  it('opens the certificado modal with a working preview and download link', async () => {
    vi.mocked(listCoachees).mockResolvedValue([coacheeCerrado])
    vi.mocked(getCiclosDeCoachee).mockResolvedValue([cicloCerrado])

    const wrapper = await mountView()
    const tabCerrados = wrapper.findAll('button').find((b) => b.text().includes('Procesos cerrados'))
    await tabCerrados!.trigger('click')

    const certificadoBtn = wrapper.findAll('button').find((b) => b.text() === 'Certificado')
    await certificadoBtn!.trigger('click')
    await flushPromises()

    let modal = new DOMWrapper(document.body)
    expect(modal.text()).toContain('Certificado de finalización')

    const previewBtn = modal.findAll('button').find((b) => b.text() === 'Vista previa')
    await previewBtn!.trigger('click')
    await flushPromises()

    modal = new DOMWrapper(document.body)
    expect(modal.text()).toContain('QA Coachee B')
    const descargarLink = modal.findAll('a').find((a) => a.text().includes('Descargar'))
    expect(descargarLink?.attributes('href')).toBe('/empresa/coachees/coachee-2/ciclos/c2/certificado')
  })

  it('opens the feedback modal with the coachee retroalimentación de cierre', async () => {
    vi.mocked(listCoachees).mockResolvedValue([coacheeCerrado])
    vi.mocked(getCiclosDeCoachee).mockResolvedValue([cicloCerrado])
    const retro: RetroalimentacionCierre = {
      id: 'retro-1',
      coacheeId: 'coachee-2',
      cicloId: 'c2',
      respuestas: [
        { bloque: 'Autoconfianza', afirmacion: 'Afirmación 1', valor: 4 },
        { bloque: 'Autoconfianza', afirmacion: 'Afirmación 2', valor: 5 },
      ],
      loQueMasGusto: 'El enfoque práctico.',
      mayoresAprendizajes: null,
      sugerencias: null,
      otrosComentarios: null,
      createdAt: '2026-03-01T00:00:00.000Z',
    }
    vi.mocked(getRetroalimentacionesDeCoachee).mockResolvedValue([retro])

    const wrapper = await mountView()
    const tabCerrados = wrapper.findAll('button').find((b) => b.text().includes('Procesos cerrados'))
    await tabCerrados!.trigger('click')

    const feedbackBtn = wrapper.findAll('button').find((b) => b.text() === 'Feedback')
    await feedbackBtn!.trigger('click')
    await flushPromises()

    const modal = new DOMWrapper(document.body)
    expect(modal.text()).toContain('Feedback del coachee')
    expect(modal.text()).toContain('Autoconfianza')
    expect(modal.text()).toContain('4.5/5')
    expect(modal.text()).toContain('El enfoque práctico.')
  })

  it('does not show the feedback button when the coachee has no retroalimentación', async () => {
    vi.mocked(listCoachees).mockResolvedValue([coacheeCerrado])
    vi.mocked(getCiclosDeCoachee).mockResolvedValue([cicloCerrado])

    const wrapper = await mountView()
    const tabCerrados = wrapper.findAll('button').find((b) => b.text().includes('Procesos cerrados'))
    await tabCerrados!.trigger('click')

    expect(wrapper.findAll('button').find((b) => b.text() === 'Feedback')).toBeUndefined()
  })

  it('opens the progreso modal directly when the route arrives with a coacheeId query param', async () => {
    vi.mocked(listCoachees).mockResolvedValue([coacheeActivo])
    vi.mocked(getCiclosDeCoachee).mockResolvedValue([cicloAbierto])

    const router = makeRouter()
    await router.push({ name: 'empresa-coachees', query: { coacheeId: 'coachee-1' } })
    await mountView(router)

    const modal = new DOMWrapper(document.body)
    expect(modal.text()).toContain('QA Paleta Verify')
  })
})
