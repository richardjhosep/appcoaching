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
vi.mock('../../api/seguimiento', async () => {
  const actual =
    await vi.importActual<typeof import('../../api/seguimiento')>('../../api/seguimiento')
  return {
    ...actual,
    addAutoevaluacion: vi.fn(),
    getMisAutoevaluaciones: vi.fn(),
  }
})

import { getMisAutoevaluaciones } from '../../api/seguimiento'

const basePlan: PlanDesarrollo = {
  id: 'plan-1',
  coacheeId: 'coachee-1',
  competenciaId: null,
  nivelActual: 2,
  nivelObjetivo: null,
  trabajarNiveles: true,
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
  createdAt: '2026-07-16T00:00:00.000Z',
  updatedAt: '2026-07-16T00:00:00.000Z',
}

describe('DefinicionTab', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(getMisAutoevaluaciones).mockResolvedValue([])
  })

  // El plan ya no se bloquea por estado (sin aprobación obligatoria del coach): todo
  // campo queda siempre editable y el botón de envío siempre visible, sea cual sea
  // el estado del plan (sin_enviar, aprobado o cambios_solicitados).
  it('keeps every field editable regardless of the plan state', () => {
    const wrapper = mount(DefinicionTab, {
      props: { plan: basePlan, competencias: [] },
    })

    const numberInputs = wrapper.findAll('input[type="number"]')
    const textareas = wrapper.findAll('textarea')

    expect(wrapper.find('select').attributes('disabled')).toBeUndefined()
    expect(numberInputs[0].attributes('disabled')).toBeUndefined() // nivelActual
    expect(numberInputs[1].attributes('disabled')).toBeUndefined() // nivelObjetivo
    expect(textareas[0].attributes('disabled')).toBeUndefined() // objetivoGeneral (va primero)
    expect(textareas[1].attributes('disabled')).toBeUndefined() // descripcionEstadoActual
  })

  it('hides nivel actual/objetivo and the autoevaluación when the coach chose not to work with niveles', () => {
    const wrapper = mount(DefinicionTab, {
      props: {
        plan: { ...basePlan, trabajarNiveles: false, competenciaId: 'comp-1' },
        competencias: [{ id: 'comp-1', nombre: 'Liderazgo', definicion: 'd', niveles: [{ nivel: 1, descripcion: 'x' }], empresaId: null }],
      },
    })

    expect(wrapper.findAll('input[type="number"]')).toHaveLength(0)
    expect(wrapper.text()).not.toContain('Nivel objetivo')
    expect(wrapper.text()).not.toContain('Autoevaluación de competencia')
    expect(wrapper.text()).toContain('Objetivo general del proceso')
    expect(wrapper.text()).toContain('Competencia asociada al objetivo')
  })

  it('always shows the submit button, even on an already-sent plan', () => {
    const wrapper = mount(DefinicionTab, {
      props: { plan: basePlan, competencias: [] },
    })

    expect(wrapper.text()).toContain('Enviar plan a mi coach')
  })

  it('hides the "tu empresa prioriza" hint for an independent coachee (sin competenciasPrioritarias)', () => {
    const wrapper = mount(DefinicionTab, {
      props: { plan: basePlan, competencias: [] },
    })

    expect(wrapper.text()).not.toContain('Tu empresa prioriza')
  })

  it('shows the empresa\'s priority competencias as chips, highlighting the one already selected', () => {
    const wrapper = mount(DefinicionTab, {
      props: {
        plan: { ...basePlan, competenciaId: 'comp-2' },
        competencias: [],
        competenciasPrioritarias: [
          {
            id: 'ec-1',
            empresaId: 'e1',
            competenciaId: 'comp-1',
            competencia: { id: 'comp-1', nombre: 'Liderazgo' },
            createdAt: '2026-07-16T00:00:00.000Z',
          },
          {
            id: 'ec-2',
            empresaId: 'e1',
            competenciaId: 'comp-2',
            competencia: { id: 'comp-2', nombre: 'Comunicación' },
            createdAt: '2026-07-16T00:00:00.000Z',
          },
        ],
      },
    })

    expect(wrapper.text()).toContain('Tu empresa prioriza')
    const chips = wrapper.findAll('label.sm\\:col-span-2 span.rounded-full')
    expect(chips.map((c) => c.text())).toEqual(['Liderazgo', 'Comunicación'])
    expect(chips[0].classes()).toContain('text-[var(--color-bronze)]') // no seleccionada
    expect(chips[1].classes()).toContain('text-[var(--color-sage)]') // ya elegida en el plan
  })
})
