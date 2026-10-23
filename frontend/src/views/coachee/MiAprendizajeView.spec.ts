import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import MiAprendizajeView from './MiAprendizajeView.vue'

vi.mock('../../api/sesiones', async () => {
  const actual = await vi.importActual<typeof import('../../api/sesiones')>('../../api/sesiones')
  return { ...actual, getMisSesiones: vi.fn() }
})
vi.mock('../../api/recursos', async () => {
  const actual = await vi.importActual<typeof import('../../api/recursos')>('../../api/recursos')
  return { ...actual, getMisRecursos: vi.fn(), listMisAprendizajes: vi.fn() }
})
vi.mock('../../api/quiz', async () => {
  const actual = await vi.importActual<typeof import('../../api/quiz')>('../../api/quiz')
  return { ...actual, listQuizzesDisponibles: vi.fn() }
})
vi.mock('../../api/flashcards', async () => {
  const actual = await vi.importActual<typeof import('../../api/flashcards')>('../../api/flashcards')
  return { ...actual, listFlashcardsDisponibles: vi.fn() }
})
vi.mock('../../api/mapas', async () => {
  const actual = await vi.importActual<typeof import('../../api/mapas')>('../../api/mapas')
  return { ...actual, listMapasDisponibles: vi.fn() }
})
vi.mock('../../api/ejercicios', async () => {
  const actual = await vi.importActual<typeof import('../../api/ejercicios')>('../../api/ejercicios')
  return { ...actual, listEjerciciosDisponibles: vi.fn() }
})
vi.mock('../../api/testEstilo', async () => {
  const actual = await vi.importActual<typeof import('../../api/testEstilo')>('../../api/testEstilo')
  return { ...actual, listTestsEstiloDisponibles: vi.fn() }
})
vi.mock('../../api/seguimiento', async () => {
  const actual = await vi.importActual<typeof import('../../api/seguimiento')>('../../api/seguimiento')
  return { ...actual, getMisEntradasDiario: vi.fn(), getMiAvance: vi.fn(), getMiLineaProgreso: vi.fn() }
})
vi.mock('../../api/planesDesarrollo', async () => {
  const actual = await vi.importActual<typeof import('../../api/planesDesarrollo')>('../../api/planesDesarrollo')
  return { ...actual, getOwnPlan: vi.fn() }
})

vi.mock('../../api/coachees', async () => {
  const actual = await vi.importActual<typeof import('../../api/coachees')>('../../api/coachees')
  return { ...actual, getMyCoachee: vi.fn() }
})

import { getMisSesiones } from '../../api/sesiones'
import { getMyCoachee } from '../../api/coachees'
import { getMisRecursos, listMisAprendizajes } from '../../api/recursos'
import { listQuizzesDisponibles } from '../../api/quiz'
import { listFlashcardsDisponibles } from '../../api/flashcards'
import { listMapasDisponibles } from '../../api/mapas'
import { listEjerciciosDisponibles } from '../../api/ejercicios'
import { listTestsEstiloDisponibles } from '../../api/testEstilo'
import { getMisEntradasDiario, getMiAvance, getMiLineaProgreso } from '../../api/seguimiento'
import { getOwnPlan } from '../../api/planesDesarrollo'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/coachee/playground', name: 'coachee-playground', component: { template: '<div />' } },
    { path: '/coachee/sesiones', name: 'coachee-sesiones', component: { template: '<div />' } },
    { path: '/coachee/biblioteca', name: 'coachee-biblioteca', component: { template: '<div />' } },
    { path: '/coachee/plan', name: 'coachee-plan', component: { template: '<div />' } },
    { path: '/coachee/progreso', name: 'coachee-progreso', component: { template: '<div />' } },
    { path: '/coachee/resumen', name: 'coachee-resumen', component: { template: '<div />' } },
    { path: '/coachee/cuenta', name: 'coachee-cuenta', component: { template: '<div />' } },
    { path: '/coachee/perfil', name: 'coachee-perfil', component: { template: '<div />' } },
    { path: '/guia-coachee', name: 'guia-coachee', component: { template: '<div />' } },
  ],
})

function mockEmptySources() {
  vi.mocked(getMisSesiones).mockResolvedValue([])
  vi.mocked(getMisRecursos).mockResolvedValue([])
  vi.mocked(listMisAprendizajes).mockResolvedValue([])
  vi.mocked(listQuizzesDisponibles).mockResolvedValue([])
  vi.mocked(listFlashcardsDisponibles).mockResolvedValue([])
  vi.mocked(listMapasDisponibles).mockResolvedValue([])
  vi.mocked(listEjerciciosDisponibles).mockResolvedValue([])
  vi.mocked(listTestsEstiloDisponibles).mockResolvedValue([])
  vi.mocked(getMisEntradasDiario).mockResolvedValue([])
  vi.mocked(getMiAvance).mockResolvedValue({ avance: null })
  vi.mocked(getMiLineaProgreso).mockResolvedValue([])
  vi.mocked(getOwnPlan).mockResolvedValue({ estado: 'aprobado', actividades: [] } as never)
  // Coachee al día (consentimiento firmado, perfil completo) para no mostrar avisos ni checklist.
  vi.mocked(getMyCoachee).mockResolvedValue({
    consentimientoInformado: true,
    telefono: '123',
    bio: null,
    fotoPath: null,
  } as never)
}

describe('MiAprendizajeView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    try {
      localStorage.clear()
    } catch {
      // happy-dom sin storage: irrelevante para estos tests
    }
  })

  it('shows an empty state when every source is empty', async () => {
    mockEmptySources()

    const wrapper = mount(MiAprendizajeView, { global: { plugins: [router] } })
    await flushPromises()

    expect(wrapper.text()).toContain('Todavía no hay nada que mostrar acá')
  })

  it('shows pending counts across sections when there is data', async () => {
    mockEmptySources()
    vi.mocked(getMisRecursos).mockResolvedValue([
      { id: 'r1', titulo: 'Guía' } as never,
      { id: 'r2', titulo: 'Guía 2' } as never,
    ])
    vi.mocked(listQuizzesDisponibles).mockResolvedValue([{ id: 'q1', mejorPuntaje: null } as never])
    vi.mocked(listFlashcardsDisponibles).mockResolvedValue([{ id: 'f1', debeRepasar: true } as never])
    vi.mocked(listEjerciciosDisponibles).mockResolvedValue([{ id: 'e1', numeroVersiones: 0 } as never])
    vi.mocked(listTestsEstiloDisponibles).mockResolvedValue([{ id: 't1', yaRespondido: false } as never])
    vi.mocked(getOwnPlan).mockResolvedValue({ estado: 'sin_enviar', actividades: [] } as never)

    const wrapper = mount(MiAprendizajeView, { global: { plugins: [router] } })
    await flushPromises()

    expect(wrapper.text()).toContain('2 sin apuntes')
    expect(wrapper.text()).toContain('1 sin responder') // Quiz
    expect(wrapper.text()).toContain('1 para repasar hoy')
    expect(wrapper.text()).toContain('1 sin entregar') // Ejercicios
    // El checklist de primeros pasos ya cubre "plan sin enviar": no se duplica con el aviso.
    expect(wrapper.text()).toContain('Define tu plan de desarrollo')
    expect(wrapper.text()).not.toContain('Todavía no has enviado tu plan')
  })

  it('shows the plan reminder once the first-steps checklist is dismissed', async () => {
    localStorage.setItem('coachee-primeros-pasos-descartados', '1')
    mockEmptySources()
    vi.mocked(getOwnPlan).mockResolvedValue({ estado: 'sin_enviar', actividades: [] } as never)
    vi.mocked(getMisRecursos).mockResolvedValue([{ id: 'r1', titulo: 'Guía' } as never])

    const wrapper = mount(MiAprendizajeView, { global: { plugins: [router] } })
    await flushPromises()

    expect(wrapper.text()).not.toContain('Primeros pasos')
    expect(wrapper.text()).toContain('Todavía no has enviado tu plan')
  })

  it('navigates to the Quiz tab in Playground when its card button is clicked', async () => {
    mockEmptySources()
    vi.mocked(listQuizzesDisponibles).mockResolvedValue([{ id: 'q1', mejorPuntaje: 2 } as never])
    const push = vi.spyOn(router, 'push')

    const wrapper = mount(MiAprendizajeView, { global: { plugins: [router] } })
    await flushPromises()

    const btn = wrapper.findAll('button').find((b) => b.text() === 'Ir a Quiz')
    await btn!.trigger('click')

    expect(push).toHaveBeenCalledWith({ name: 'coachee-playground', query: { tab: 'quiz' } })
  })

  it('shows an actividad pendiente in "Tareas pendientes" and navigates to the plan on click', async () => {
    mockEmptySources()
    vi.mocked(listQuizzesDisponibles).mockResolvedValue([{ id: 'q1', mejorPuntaje: 2 } as never])
    vi.mocked(getOwnPlan).mockResolvedValue({
      estado: 'aprobado',
      actividades: [{ id: 'a1', actividad: 'Practicar feedback', estado: 'pendiente' }],
    } as never)
    const push = vi.spyOn(router, 'push')

    const wrapper = mount(MiAprendizajeView, { global: { plugins: [router] } })
    await flushPromises()

    expect(wrapper.text()).toContain('Practicar feedback')
    expect(wrapper.text()).toContain('Pendiente')

    const verBtn = wrapper.findAll('button').find((b) => b.text() === 'Ver')
    await verBtn!.trigger('click')

    expect(push).toHaveBeenCalledWith({ name: 'coachee-plan', query: undefined })
  })

  it('shows "Nada pendiente por ahora" when there are no tareas pendientes', async () => {
    mockEmptySources()
    vi.mocked(listQuizzesDisponibles).mockResolvedValue([{ id: 'q1', mejorPuntaje: 2 } as never])

    const wrapper = mount(MiAprendizajeView, { global: { plugins: [router] } })
    await flushPromises()

    expect(wrapper.text()).toContain('Nada pendiente por ahora')
  })

  it('shows an error state with retry when the plan fails to load', async () => {
    mockEmptySources()
    vi.mocked(getOwnPlan).mockRejectedValueOnce(new Error('plan caído'))

    const wrapper = mount(MiAprendizajeView, { global: { plugins: [router] } })
    await flushPromises()

    expect(wrapper.find('[role="alert"]').text()).toContain('plan caído')
    expect(wrapper.text()).not.toContain('Todavía no hay nada que mostrar acá')

    await wrapper.findAll('button').find((b) => b.text() === 'Reintentar')!.trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('Todavía no hay nada que mostrar acá')
  })

  it('warns about partial failures instead of presenting misleading empties', async () => {
    mockEmptySources()
    vi.mocked(listQuizzesDisponibles).mockRejectedValue(new Error('quiz caído'))
    vi.mocked(getMisRecursos).mockResolvedValue([{ id: 'r1', titulo: 'Guía' } as never])

    const wrapper = mount(MiAprendizajeView, { global: { plugins: [router] } })
    await flushPromises()

    expect(wrapper.find('[role="status"]').text()).toContain('No pudimos cargar parte de tu información')
    expect(wrapper.text()).toContain('1 sin apuntes')
  })

  it('shows a banner when the consentimiento informado is pending (checklist dismissed)', async () => {
    localStorage.setItem('coachee-primeros-pasos-descartados', '1')
    mockEmptySources()
    vi.mocked(getMyCoachee).mockResolvedValue({ consentimientoInformado: false, telefono: '1' } as never)

    const wrapper = mount(MiAprendizajeView, { global: { plugins: [router] } })
    await flushPromises()

    expect(wrapper.text()).toContain('Tu consentimiento informado está pendiente')
    expect(wrapper.find('a[href="/coachee/cuenta"]').exists()).toBe(true)
  })

  it('shows the "Primeros pasos" checklist from real data and lets the coachee dismiss it', async () => {
    mockEmptySources()
    vi.mocked(getMyCoachee).mockResolvedValue({ consentimientoInformado: false, telefono: null, bio: null, fotoPath: null } as never)
    vi.mocked(getOwnPlan).mockResolvedValue({ estado: 'sin_enviar', objetivoGeneral: null, actividades: [] } as never)

    const wrapper = mount(MiAprendizajeView, { global: { plugins: [router] } })
    await flushPromises()

    expect(wrapper.text()).toContain('Primeros pasos')
    expect(wrapper.text()).toContain('Confirma tu consentimiento informado')
    expect(wrapper.text()).toContain('Agenda tu primera sesión')
    expect(wrapper.find('a[href="/guia-coachee"]').exists()).toBe(true)

    await wrapper.findAll('button').find((b) => b.text() === 'Ocultar esta lista')!.trigger('click')
    expect(wrapper.text()).not.toContain('Primeros pasos')
  })

  it('does not show "Primeros pasos" when nothing is pending', async () => {
    mockEmptySources()
    vi.mocked(getMisSesiones).mockResolvedValue([{ id: 's1', fechaHora: '2999-01-01T00:00:00.000Z' } as never])
    vi.mocked(getOwnPlan).mockResolvedValue({ estado: 'aprobado', objetivoGeneral: 'x', actividades: [] } as never)

    const wrapper = mount(MiAprendizajeView, { global: { plugins: [router] } })
    await flushPromises()

    expect(wrapper.text()).not.toContain('Primeros pasos')
  })
})
