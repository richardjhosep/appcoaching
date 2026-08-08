import { describe, it, expect } from 'vitest'
import { coacheesQueNecesitanAlgo } from './dashboardAtencion'
import type { PlanDesarrollo } from '../api/planesDesarrollo'
import type { Alertas } from '../api/negocio'
import type { IndependienteLegal } from '../api/legal'

function plan(overrides: Partial<PlanDesarrollo>): PlanDesarrollo {
  return {
    id: 'p1',
    coacheeId: 'c1',
    coachee: { id: 'c1', nombre: 'Rodrigo Peña', telefono: null, createdAt: '2026-01-01T00:00:00.000Z' },
    competenciaId: null,
    nivelActual: null,
    nivelObjetivo: null,
    plazo: null,
    descripcionEstadoActual: null,
    objetivoGeneral: null,
    estado: 'sin_enviar',
    enviadoEn: null,
    comentarioCoach: null,
    habitoCuando: null,
    habitoEnVezDe: null,
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  } as PlanDesarrollo
}

const alertasVacias: Alertas = {
  ciclosPorVencer: [],
  coacheesSinLogros: [],
  coacheesSinProximaSesion: [],
}

describe('coacheesQueNecesitanAlgo', () => {
  it('returns an empty list when there is nothing pending anywhere', () => {
    const filas = coacheesQueNecesitanAlgo({
      planesSinEnviar: [],
      planesPendientesAprobacion: [],
      alertas: alertasVacias,
      independientesLegal: [],
    })

    expect(filas).toEqual([])
  })

  it('merges a coachee appearing in multiple sources into a single row with every flag set', () => {
    const filas = coacheesQueNecesitanAlgo({
      planesSinEnviar: [plan({ coacheeId: 'c1' })],
      planesPendientesAprobacion: [],
      alertas: {
        ciclosPorVencer: [],
        coacheesSinLogros: [{ coacheeId: 'c1', nombre: 'Rodrigo Peña' }],
        coacheesSinProximaSesion: [{ coacheeId: 'c1', nombre: 'Rodrigo Peña' }],
      },
      independientesLegal: [],
    })

    expect(filas).toHaveLength(1)
    expect(filas[0]).toMatchObject({
      coacheeId: 'c1',
      nombre: 'Rodrigo Peña',
      planSinEnviar: true,
      sinLogros: true,
      sinProximaSesion: true,
    })
  })

  it('keeps distinct coachees as separate rows', () => {
    const filas = coacheesQueNecesitanAlgo({
      planesSinEnviar: [plan({ coacheeId: 'c1' })],
      planesPendientesAprobacion: [plan({ coacheeId: 'c2', coachee: { id: 'c2', nombre: 'Ana Reagenda', telefono: null, createdAt: '2026-01-01T00:00:00.000Z' } })],
      alertas: alertasVacias,
      independientesLegal: [],
    })

    expect(filas).toHaveLength(2)
    expect(filas.map((f) => f.coacheeId).sort()).toEqual(['c1', 'c2'])
  })

  it('sets cicloPorVencer with its sesionesRestantes', () => {
    const filas = coacheesQueNecesitanAlgo({
      planesSinEnviar: [],
      planesPendientesAprobacion: [],
      alertas: {
        ciclosPorVencer: [{ coacheeId: 'c1', nombre: 'Rodrigo Peña', sesionesRestantes: 1 }],
        coacheesSinLogros: [],
        coacheesSinProximaSesion: [],
      },
      independientesLegal: [],
    })

    expect(filas[0].cicloPorVencer).toEqual({ sesionesRestantes: 1 })
  })

  it('flags legalPendiente only for an independiente with contrato/NDA not firmado', () => {
    const conPendiente: IndependienteLegal = {
      coacheeId: 'c1',
      nombre: 'Rodrigo Peña',
      contrato: { estado: 'pendiente', fecha: null, vigencia: null, tieneArchivo: false },
      nda: { estado: 'pendiente', fecha: null, vigencia: null, tieneArchivo: false },
      consentimientoInformado: false,
      createdAt: '2026-01-01T00:00:00.000Z',
    }
    const alDia: IndependienteLegal = {
      coacheeId: 'c2',
      nombre: 'Ana Reagenda',
      contrato: { estado: 'firmado', fecha: '2026-01-01', vigencia: '2099-01-01', tieneArchivo: true },
      nda: { estado: 'firmado', fecha: '2026-01-01', vigencia: '2099-01-01', tieneArchivo: true },
      consentimientoInformado: true,
      createdAt: '2026-01-01T00:00:00.000Z',
    }

    const filas = coacheesQueNecesitanAlgo({
      planesSinEnviar: [],
      planesPendientesAprobacion: [],
      alertas: alertasVacias,
      independientesLegal: [conPendiente, alDia],
    })

    expect(filas).toHaveLength(1)
    expect(filas[0].coacheeId).toBe('c1')
    expect(filas[0].legalPendiente).toBe(true)
  })
})
