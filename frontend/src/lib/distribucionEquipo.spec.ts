import { describe, it, expect } from 'vitest'
import { distribucionPorArea, competenciasTrabajadas } from './distribucionEquipo'

describe('distribucionPorArea', () => {
  it('returns an empty list with no coachees', () => {
    expect(distribucionPorArea([])).toEqual([])
  })

  it('groups by areaGerencia and sorts by count desc', () => {
    const resultado = distribucionPorArea([
      { areaGerencia: 'Operaciones' },
      { areaGerencia: 'Operaciones' },
      { areaGerencia: 'Proyectos' },
      { areaGerencia: 'Finanzas' },
    ])

    expect(resultado).toEqual([
      { area: 'Operaciones', count: 2, pct: 50 },
      { area: 'Finanzas', count: 1, pct: 25 },
      { area: 'Proyectos', count: 1, pct: 25 },
    ])
  })

  it('groups coachees with no area (null, undefined or blank) under "Sin asignar"', () => {
    const resultado = distribucionPorArea([
      { areaGerencia: null },
      { areaGerencia: undefined },
      { areaGerencia: '  ' },
      { areaGerencia: 'Tecnología' },
    ])

    expect(resultado).toEqual([
      { area: 'Sin asignar', count: 3, pct: 75 },
      { area: 'Tecnología', count: 1, pct: 25 },
    ])
  })
})

describe('competenciasTrabajadas', () => {
  it('returns an empty list with no filas', () => {
    expect(competenciasTrabajadas([])).toEqual([])
  })

  it('excludes coachees without a competencia asignada', () => {
    const resultado = competenciasTrabajadas([
      { competenciaNombre: null, coacheeNombre: 'Sin plan' },
      { competenciaNombre: 'Delegación y gestión de equipos', coacheeNombre: 'Ana' },
    ])

    expect(resultado).toEqual([
      { competencia: 'Delegación y gestión de equipos', count: 1, coachees: ['Ana'] },
    ])
  })

  it('groups by competencia, sorted by count desc, with the coachee names attached', () => {
    const resultado = competenciasTrabajadas([
      { competenciaNombre: 'Comunicación ascendente', coacheeNombre: 'Ana' },
      { competenciaNombre: 'Comunicación ascendente', coacheeNombre: 'Beto' },
      { competenciaNombre: 'Foco estratégico', coacheeNombre: 'Caro' },
    ])

    expect(resultado).toEqual([
      { competencia: 'Comunicación ascendente', count: 2, coachees: ['Ana', 'Beto'] },
      { competencia: 'Foco estratégico', count: 1, coachees: ['Caro'] },
    ])
  })
})
