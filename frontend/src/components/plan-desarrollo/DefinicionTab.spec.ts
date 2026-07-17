import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import DefinicionTab from './DefinicionTab.vue'
import type { PlanDesarrollo } from '../../api/planesDesarrollo'

vi.mock('../../api/planesDesarrollo', async () => {
  const actual =
    await vi.importActual<typeof import('../../api/planesDesarrollo')>('../../api/planesDesarrollo')
  return {
    ...actual,
    updateOwnPlan: vi.fn(),
    enviarPlan: vi.fn(),
    addObjetivo: vi.fn(),
    updateObjetivo: vi.fn(),
    removeObjetivo: vi.fn(),
    getOwnPlan: vi.fn(),
  }
})

const basePlan: PlanDesarrollo = {
  id: 'plan-1',
  coacheeId: 'coachee-1',
  competenciaId: null,
  nivelActual: 2,
  nivelObjetivo: null,
  plazo: null,
  descripcionEstadoActual: null,
  objetivoGeneral: null,
  estado: 'pendiente_aprobacion',
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
  createdAt: '2026-07-16T00:00:00.000Z',
  updatedAt: '2026-07-16T00:00:00.000Z',
}

describe('DefinicionTab', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('locks competencia/nivelObjetivo/objetivoGeneral but keeps nivelActual/plazo/descripcion free while pending approval', () => {
    const wrapper = mount(DefinicionTab, {
      props: { plan: basePlan, competencias: [], locked: true },
    })

    const numberInputs = wrapper.findAll('input[type="number"]')
    const textareas = wrapper.findAll('textarea')

    expect(wrapper.find('select').attributes('disabled')).toBeDefined()
    expect(numberInputs[0].attributes('disabled')).toBeUndefined() // nivelActual: libre
    expect(numberInputs[1].attributes('disabled')).toBeDefined() // nivelObjetivo: bloqueado
    expect(textareas[0].attributes('disabled')).toBeUndefined() // descripcionEstadoActual: libre
    expect(textareas[1].attributes('disabled')).toBeDefined() // objetivoGeneral: bloqueado
  })

  it('hides the submit button while the plan is locked', () => {
    const wrapper = mount(DefinicionTab, {
      props: { plan: basePlan, competencias: [], locked: true },
    })

    expect(wrapper.text()).not.toContain('Enviar plan para aprobación')
  })

  it('shows the submit button and enables every field when not locked', () => {
    const wrapper = mount(DefinicionTab, {
      props: { plan: { ...basePlan, estado: 'sin_enviar' }, competencias: [], locked: false },
    })

    expect(wrapper.text()).toContain('Enviar plan para aprobación')
    expect(wrapper.find('select').attributes('disabled')).toBeUndefined()
  })
})
