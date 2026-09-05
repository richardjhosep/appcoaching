import { describe, it, expect } from 'vitest'
import { agruparPorDia } from './sesionesPorDia'
import type { Sesion } from '../api/sesiones'

function sesion(id: string, fechaHora: string, coacheeNombre?: string): Sesion {
  return {
    id,
    coacheeId: `coachee-${id}`,
    fechaHora,
    linkVideollamada: null,
    resumenCompartido: null,
    confirmada: false,
    postSesion: null,
    coachee: coacheeNombre ? { id: `coachee-${id}`, nombre: coacheeNombre } : undefined,
  }
}

describe('agruparPorDia', () => {
  it('returns an empty list for no sessions', () => {
    expect(agruparPorDia([])).toEqual([])
  })

  it('groups sessions of the same calendar day together', () => {
    const grupos = agruparPorDia([
      sesion('1', '2026-09-07T13:00:00.000Z', 'Ana'),
      sesion('2', '2026-09-07T18:00:00.000Z', 'Beto'),
    ])

    expect(grupos).toHaveLength(1)
    expect(grupos[0]!.sesiones.map((s) => s.id)).toEqual(['1', '2'])
  })

  it('sorts sessions within a day by time, ascending', () => {
    const grupos = agruparPorDia([
      sesion('tarde', '2026-09-07T20:00:00.000Z'),
      sesion('manana', '2026-09-07T13:00:00.000Z'),
    ])

    expect(grupos[0]!.sesiones.map((s) => s.id)).toEqual(['manana', 'tarde'])
  })

  it('sorts days ascending, oldest first', () => {
    const grupos = agruparPorDia([
      sesion('lunes-sig', '2026-09-14T13:00:00.000Z'),
      sesion('lunes', '2026-09-07T13:00:00.000Z'),
    ])

    expect(grupos.map((g) => g.fecha)).toEqual([
      grupos.find((g) => g.sesiones[0]!.id === 'lunes')!.fecha,
      grupos.find((g) => g.sesiones[0]!.id === 'lunes-sig')!.fecha,
    ])
    expect(grupos[0]!.fecha < grupos[1]!.fecha).toBe(true)
  })
})
