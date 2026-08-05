import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import PlanesListView from './PlanesListView.vue'
import type { PlanDesarrollo } from '../../api/planesDesarrollo'

vi.mock('../../api/planesDesarrollo', async () => {
  const actual = await vi.importActual<typeof import('../../api/planesDesarrollo')>(
    '../../api/planesDesarrollo',
  )
  return { ...actual, listPlanes: vi.fn(), enviarRecordatorio: vi.fn() }
})

vi.mock('../../lib/notify', () => ({
  notifySuccess: vi.fn(),
  notifyError: vi.fn(),
}))

import { listPlanes, enviarRecordatorio } from '../../api/planesDesarrollo'

const diasAtras = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString()

const plan: PlanDesarrollo = {
  id: 'plan-1',
  coacheeId: 'c1',
  coachee: {
    id: 'c1',
    nombre: 'Felipe Cortes',
    empresa: { id: 'e1', nombre: 'Orbiflex' },
    telefono: '+56 9 1234 5678',
    user: { id: 'u1', email: 'felipe@example.com' },
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  competenciaId: 'comp-1',
  competencia: { id: 'comp-1', nombre: 'Liderazgo situacional' },
  nivelActual: 2,
  nivelObjetivo: 4,
  plazo: '3 meses',
  descripcionEstadoActual: null,
  objetivoGeneral: 'Delegar con mayor confianza en el equipo.',
  estado: 'pendiente_aprobacion',
  enviadoEn: diasAtras(3),
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
  objetivos: [
    { id: 'o1', descripcion: 'Delegar 2 tareas por semana', orden: 1 },
    { id: 'o2', descripcion: 'Dar feedback semanal', orden: 2 },
  ],
  actividades: [
    { id: 'a1', objetivoId: 'o1', actividad: 'Reunión de delegación', fechaInicio: null, fechaFin: null, estado: 'completada' },
    { id: 'a2', objetivoId: 'o1', actividad: 'Seguimiento', fechaInicio: null, fechaFin: null, estado: 'pendiente' },
  ],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-15T00:00:00.000Z',
}

describe('PlanesListView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(listPlanes).mockResolvedValue([plan])
    vi.mocked(enviarRecordatorio).mockResolvedValue(undefined)
  })

  it('shows the coachee, empresa, estado, objetivo general and progress at a glance', async () => {
    const wrapper = mount(PlanesListView)
    await flushPromises()

    const text = wrapper.text()
    expect(text).toContain('Felipe Cortes')
    expect(text).toContain('felipe@example.com · +56 9 1234 5678 · Orbiflex')
    expect(text).toContain('Pendiente de aprobación')
    expect(text).toContain('Delegar con mayor confianza en el equipo.')
    expect(text).toContain('Liderazgo situacional')
    expect(text).toContain('Nivel 2 → 4')
    expect(text).toContain('2 objetivos')
    expect(text).toContain('1/2 actividades')
    expect(text).toContain('Plazo: 3 meses')
  })

  it('falls back to "Independiente" when the coachee has no empresa', async () => {
    vi.mocked(listPlanes).mockResolvedValue([
      { ...plan, coachee: { ...plan.coachee!, empresa: null } },
    ])

    const wrapper = mount(PlanesListView)
    await flushPromises()

    expect(wrapper.text()).toContain('felipe@example.com · +56 9 1234 5678 · Independiente')
  })

  it('shows a muted placeholder when there is no objetivo general yet', async () => {
    vi.mocked(listPlanes).mockResolvedValue([
      { ...plan, objetivoGeneral: null, competencia: null, objetivos: [], actividades: [] },
    ])

    const wrapper = mount(PlanesListView)
    await flushPromises()

    expect(wrapper.text()).toContain('Sin objetivo general definido todavía.')
    expect(wrapper.text()).toContain('0 objetivos')
    expect(wrapper.text()).not.toContain('actividades')
  })

  it('shows a day counter since the plan was sent, for pendiente_aprobacion', async () => {
    const wrapper = mount(PlanesListView)
    await flushPromises()

    expect(wrapper.text()).toContain('Esperando hace 3 días')
  })

  it('shows a red day-since-created counter and a reminder button when sin_enviar', async () => {
    vi.mocked(listPlanes).mockResolvedValue([
      {
        ...plan,
        estado: 'sin_enviar',
        enviadoEn: null,
        coachee: { ...plan.coachee!, createdAt: diasAtras(5) },
      },
    ])

    const wrapper = mount(PlanesListView)
    await flushPromises()
    await wrapper.find('select').setValue('sin_enviar')
    await flushPromises()

    expect(wrapper.text()).toContain('5 días sin enviar el plan')
    const boton = wrapper.findAll('button').find((b) => b.text() === 'Enviar recordatorio')
    expect(boton).toBeTruthy()

    await boton!.trigger('click')
    await flushPromises()

    expect(enviarRecordatorio).toHaveBeenCalledWith('c1')
  })

  it('does not show the red counter the same day the coachee was created', async () => {
    vi.mocked(listPlanes).mockResolvedValue([
      { ...plan, estado: 'sin_enviar', enviadoEn: null, coachee: { ...plan.coachee!, createdAt: diasAtras(0) } },
    ])

    const wrapper = mount(PlanesListView)
    await flushPromises()
    await wrapper.find('select').setValue('sin_enviar')
    await flushPromises()

    expect(wrapper.text()).not.toContain('sin enviar el plan')
    expect(wrapper.findAll('button').find((b) => b.text() === 'Enviar recordatorio')).toBeFalsy()
  })

  it('always lists pendiente_aprobacion plans, even when a different estado is selected', async () => {
    const aprobado: PlanDesarrollo = {
      ...plan,
      id: 'plan-2',
      coacheeId: 'c2',
      coachee: { id: 'c2', nombre: 'Ana Reagenda', createdAt: '2026-01-01T00:00:00.000Z' },
      estado: 'aprobado',
    }
    vi.mocked(listPlanes).mockResolvedValue([plan, aprobado])

    const wrapper = mount(PlanesListView)
    await flushPromises()

    // Default filtro is already 'pendiente_aprobacion', so switch it away and confirm the
    // pendiente plan (Felipe) is still shown alongside the now-matching aprobado one (Ana).
    await wrapper.find('select').setValue('aprobado')
    await flushPromises()

    const text = wrapper.text()
    expect(text).toContain('Felipe Cortes')
    expect(text).toContain('Ana Reagenda')
  })

  it('caps the list at 5 cards per page and paginates the rest', async () => {
    const planes = Array.from({ length: 7 }, (_, i) => ({
      ...plan,
      id: `plan-${i}`,
      coacheeId: `c${i}`,
      coachee: { id: `c${i}`, nombre: `Coachee ${i}`, createdAt: '2026-01-01T00:00:00.000Z' },
    }))
    vi.mocked(listPlanes).mockResolvedValue(planes)

    const wrapper = mount(PlanesListView)
    await flushPromises()

    expect(wrapper.text()).toContain('Coachee 0')
    expect(wrapper.text()).toContain('Coachee 4')
    expect(wrapper.text()).not.toContain('Coachee 5')
    expect(wrapper.text()).toContain('Mostrando 1–5 de 7')

    const siguienteBtn = wrapper.findAll('button').find((b) => b.text() === 'Siguiente →')
    await siguienteBtn!.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Coachee 5')
    expect(wrapper.text()).toContain('Coachee 6')
    expect(wrapper.text()).not.toContain('Coachee 0')
  })
})
