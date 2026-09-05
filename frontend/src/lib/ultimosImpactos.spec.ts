import { describe, it, expect } from 'vitest'
import { ultimosImpactos, type FilaConImpactos } from './ultimosImpactos'

describe('ultimosImpactos', () => {
  it('excludes ciclos without impactoNegocio or still open', () => {
    const filas: FilaConImpactos[] = [
      {
        coachee: { nombre: 'Ana' },
        resumen: { competenciaNombre: 'Liderazgo' },
        ciclos: [
          { fechaCierre: null, impactoNegocio: 'Ciclo abierto, no cuenta' },
          { fechaCierre: '2026-06-01', impactoNegocio: null },
        ],
      },
    ]

    expect(ultimosImpactos(filas)).toEqual([])
  })

  it('sorts by fechaCierre, most recent first', () => {
    const filas: FilaConImpactos[] = [
      {
        coachee: { nombre: 'Ana' },
        resumen: { competenciaNombre: 'Liderazgo' },
        ciclos: [{ fechaCierre: '2026-03-01', impactoNegocio: 'Impacto de marzo' }],
      },
      {
        coachee: { nombre: 'Beto' },
        resumen: { competenciaNombre: 'Comunicación' },
        ciclos: [{ fechaCierre: '2026-08-01', impactoNegocio: 'Impacto de agosto' }],
      },
    ]

    const resultado = ultimosImpactos(filas)

    expect(resultado.map((r) => r.coacheeNombre)).toEqual(['Beto', 'Ana'])
    expect(resultado[0].impacto).toBe('Impacto de agosto')
  })

  it('caps the result to the given limite', () => {
    const filas: FilaConImpactos[] = Array.from({ length: 8 }, (_, i) => ({
      coachee: { nombre: `Coachee ${i}` },
      resumen: { competenciaNombre: null },
      ciclos: [{ fechaCierre: `2026-01-${String(i + 1).padStart(2, '0')}`, impactoNegocio: `Impacto ${i}` }],
    }))

    expect(ultimosImpactos(filas, 5)).toHaveLength(5)
    expect(ultimosImpactos(filas)).toHaveLength(5) // default limite = 5
  })
})
