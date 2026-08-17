import { describe, it, expect } from 'vitest'
import { resumirCoachee } from './resumenCoacheeEmpresa'
import type { Ciclo } from '../api/ciclos'
import type { PlanDesarrollo } from '../api/planesDesarrollo'

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

const cicloCerrado: Ciclo = {
  ...cicloAbierto,
  id: 'c0',
  fechaCierre: '2025-12-01T00:00:00.000Z',
  resultado: 'logrado',
}

function basePlan(overrides: Partial<PlanDesarrollo> = {}): PlanDesarrollo {
  return {
    id: 'plan-1',
    coacheeId: 'coachee-1',
    competenciaId: 'comp-1',
    competencia: { id: 'comp-1', nombre: 'Comunicación' },
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
    ...overrides,
  } as PlanDesarrollo
}

describe('resumirCoachee', () => {
  it('is "sin_iniciar" when there is no plan and no cycle history', () => {
    const r = resumirCoachee({ plan: null, cicloActual: null, ciclos: [], avance: null, proximaSesion: null })

    expect(r.estado).toBe('sin_iniciar')
    expect(r.competenciaNombre).toBeNull()
    expect(r.avance).toBeNull()
  })

  it('is "en_curso" when there is an open cycle, even if older cycles are closed', () => {
    const r = resumirCoachee({
      plan: basePlan(),
      cicloActual: cicloAbierto,
      ciclos: [cicloAbierto, cicloCerrado],
      avance: 40,
      proximaSesion: null,
    })

    expect(r.estado).toBe('en_curso')
    expect(r.competenciaNombre).toBe('Comunicación')
    expect(r.avance).toBe(40)
  })

  it('is "completado" when there is no open cycle but a closed one exists', () => {
    const r = resumirCoachee({
      plan: basePlan(),
      cicloActual: null,
      ciclos: [cicloCerrado],
      avance: 90,
      proximaSesion: null,
    })

    expect(r.estado).toBe('completado')
  })

  it('surfaces alertaPorVencer from the open cycle and proximaSesionFecha when present', () => {
    const r = resumirCoachee({
      plan: basePlan(),
      cicloActual: { ...cicloAbierto, alertaPorVencer: true },
      ciclos: [cicloAbierto],
      avance: 50,
      proximaSesion: {
        id: 's1',
        coacheeId: 'coachee-1',
        fechaHora: '2026-09-01T10:00:00.000Z',
        linkVideollamada: null,
        resumenCompartido: null,
        postSesion: null,
      },
    })

    expect(r.alertaPorVencer).toBe(true)
    expect(r.proximaSesionFecha).toBe('2026-09-01T10:00:00.000Z')
  })
})
