import { describe, it, expect } from 'vitest'
import type { PuntoProgreso } from '../api/seguimiento'
import { escaparHtml, formatoDelta, resumenAccesible, variacion, ordenarPorFecha } from './progresoCamino'

const p = (sesionId: string, fecha: string, cercaniaObjetivo: number): PuntoProgreso => ({
  sesionId,
  fecha,
  cercaniaObjetivo,
  aprendizaje: null,
})

describe('variacion', () => {
  it('no calcula cambios con una sola sesión', () => {
    expect(variacion([p('a', '2026-01-01', 5)])).toEqual({ respectoAnterior: null, desdeInicio: null })
  })

  it('con dos sesiones solo da el cambio respecto a la anterior', () => {
    expect(variacion([p('a', '2026-01-01', 3), p('b', '2026-02-01', 6)])).toEqual({
      respectoAnterior: 3,
      desdeInicio: null,
    })
  })

  it('con tres o más da el cambio respecto a la anterior y desde la primera, sin importar el orden recibido', () => {
    const puntos = [p('c', '2026-03-01', 8), p('a', '2026-01-01', 3), p('b', '2026-02-01', 9)]

    expect(variacion(puntos)).toEqual({ respectoAnterior: -1, desdeInicio: 5 })
  })
})

describe('formatoDelta', () => {
  it('usa signo + y un menos tipográfico, y 0 sin signo', () => {
    expect(formatoDelta(2)).toBe('+2')
    expect(formatoDelta(-3)).toBe('−3')
    expect(formatoDelta(0)).toBe('0')
  })
})

describe('resumenAccesible', () => {
  it('describe cada caso en lenguaje llano', () => {
    expect(resumenAccesible([])).toContain('Sin sesiones')
    expect(resumenAccesible([p('a', '2026-01-01', 5)])).toBe('Punto de partida: 5 sobre 10 en tu primera sesión.')
    expect(resumenAccesible([p('a', '2026-01-01', 3), p('b', '2026-02-01', 7)])).toBe(
      'Evolución de tu cercanía al objetivo en 2 sesiones: de 3 a 7 sobre 10.',
    )
  })
})

describe('ordenarPorFecha / escaparHtml', () => {
  it('ordena ascendente sin mutar la entrada', () => {
    const entrada = [p('b', '2026-02-01', 1), p('a', '2026-01-01', 2)]
    expect(ordenarPorFecha(entrada).map((x) => x.sesionId)).toEqual(['a', 'b'])
    expect(entrada[0]!.sesionId).toBe('b')
  })

  it('escapa HTML del texto libre antes de ir al tooltip', () => {
    expect(escaparHtml('<img src=x onerror="a()"> & \'q\'')).toBe(
      '&lt;img src=x onerror=&quot;a()&quot;&gt; &amp; &#39;q&#39;',
    )
  })
})
