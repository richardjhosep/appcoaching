import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import HabitoEjecucionTab from './HabitoEjecucionTab.vue'
import type { PlanDesarrollo } from '../../api/planesDesarrollo'
import type { Ciclo } from '../../api/ciclos'

vi.mock('../../api/planesDesarrollo', async () => {
  const actual =
    await vi.importActual<typeof import('../../api/planesDesarrollo')>('../../api/planesDesarrollo')
  return {
    ...actual,
    updateOwnPlan: vi.fn(),
    addActividad: vi.fn(),
    updateActividad: vi.fn(),
    removeActividad: vi.fn(),
    getOwnPlan: vi.fn(),
  }
})
vi.mock('../../api/ciclos', async () => {
  const actual = await vi.importActual<typeof import('../../api/ciclos')>('../../api/ciclos')
  return { ...actual, getMiCicloActual: vi.fn() }
})

import { addActividad, updateActividad } from '../../api/planesDesarrollo'
import { getMiCicloActual } from '../../api/ciclos'

const basePlan: PlanDesarrollo = {
  id: 'plan-1',
  coacheeId: 'coachee-1',
  competenciaId: null,
  nivelActual: null,
  nivelObjetivo: null,
  trabajarNiveles: false,
  plazo: null,
  descripcionEstadoActual: null,
  objetivoGeneral: null,
  estado: 'pendiente_aprobacion',
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
  objetivos: [{ id: 'obj-1', descripcion: 'Delegar mejor', orden: 1 }],
  actividades: [
    {
      id: 'act-1',
      objetivoId: 'obj-1',
      actividad: 'Delegar la próxima reunión de equipo',
      fechaInicio: '2026-09-01',
      fechaFin: '2026-09-15',
      estado: 'pendiente',
      observaciones: null,
    },
  ],
  createdAt: '2026-07-16T00:00:00.000Z',
  updatedAt: '2026-07-16T00:00:00.000Z',
}

const cicloAbierto: Ciclo = {
  id: 'ciclo-1',
  coacheeId: 'coachee-1',
  totalSesiones: 10,
  fechaApertura: '2026-08-01T00:00:00.000Z',
  fechaCierre: null,
  resultado: null,
  resumenReunionInicial: null,
  informeFinal: null,
  impactoNegocio: null,
  informePdfNombre: null,
  informePdfPath: null,
  sesionesRealizadas: 1,
  sesionesRestantes: 9,
  alertaPorVencer: false,
}

async function mountTab() {
  const wrapper = mount(HabitoEjecucionTab, { props: { plan: basePlan } })
  await flushPromises()
  return wrapper
}

describe('HabitoEjecucionTab', () => {
  beforeEach(() => {
    vi.mocked(getMiCicloActual).mockResolvedValue(cicloAbierto)
  })

  it('renders fechaInicio/fechaFin as real dates, formatted, not raw "Semana X" text', async () => {
    const wrapper = await mountTab()

    expect(wrapper.text()).toContain('1 sept')
    expect(wrapper.text()).toContain('15 sept')
    expect(wrapper.text()).not.toContain('Semana')
  })

  it('uses native date inputs for the new-activity form, bounded by the ciclo abierto', async () => {
    const wrapper = await mountTab()

    const inputs = wrapper.findAll('input[type="date"][data-nueva-actividad]')
    expect(inputs).toHaveLength(2)
    // fechaApertura del ciclo es '2026-08-01T...' → min debe ser '2026-08-01'
    expect(inputs[0].attributes('min')).toBe('2026-08-01')
  })

  it('does not bound the date inputs when the coachee has no open ciclo yet', async () => {
    vi.mocked(getMiCicloActual).mockResolvedValue(null)

    const wrapper = await mountTab()

    const inputs = wrapper.findAll('input[type="date"][data-nueva-actividad]')
    expect(inputs[0].attributes('min')).toBeUndefined()
  })

  it('sends real ISO dates when creating an actividad', async () => {
    vi.mocked(addActividad).mockResolvedValue({
      id: 'act-2',
      objetivoId: 'obj-1',
      actividad: 'Nueva actividad',
      fechaInicio: '2026-09-05',
      fechaFin: '2026-09-20',
      estado: 'pendiente',
      observaciones: null,
    })

    const wrapper = await mountTab()
    // El primer <select> es el estado de la actividad ya existente (act-1); el
    // selector "vincular a un objetivo" del formulario nuevo es el último.
    const selects = wrapper.findAll('select')
    await selects[selects.length - 1].setValue('obj-1')
    await wrapper.find('input[type="text"]').setValue('Nueva actividad')
    const dateInputs = wrapper.findAll('input[type="date"][data-nueva-actividad]')
    await dateInputs[0].setValue('2026-09-05')
    await dateInputs[1].setValue('2026-09-20')
    const agregarBtn = wrapper.findAll('button').find((b) => b.text() === 'Agregar actividad')
    await agregarBtn!.trigger('click')
    await flushPromises()

    expect(addActividad).toHaveBeenCalledWith({
      objetivoId: 'obj-1',
      actividad: 'Nueva actividad',
      fechaInicio: '2026-09-05',
      fechaFin: '2026-09-20',
    })
  })

  it('shows the término date even when the actividad has no inicio, and lets it be edited inline', async () => {
    const wrapper = await mountTab()
    // act-1 ya existe: sus dos inputs de fecha inline vienen antes que los del formulario nuevo.
    const inline = wrapper.findAll('input[type="date"]:not([data-nueva-actividad])')
    expect(inline).toHaveLength(2)

    await inline[1].setValue('2026-09-30')
    await flushPromises()

    expect(updateActividad).toHaveBeenCalledWith('act-1', { fechaFin: '2026-09-30' })
  })
})
