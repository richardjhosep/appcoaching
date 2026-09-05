import { describe, it, expect } from 'vitest'
import { semaforoCartera } from './semaforoCartera'

function fechaEnDias(dias: number): string {
  const d = new Date()
  d.setDate(d.getDate() + dias)
  return d.toISOString().slice(0, 10)
}

describe('semaforoCartera', () => {
  it('is verde when there is no fechaFin registered', () => {
    expect(semaforoCartera({ diasParaVencer: null, ultimaGestion: null })).toBe('verde')
  })

  it('is rojo once the contrato already expired, gestión or not', () => {
    expect(semaforoCartera({ diasParaVencer: -1, ultimaGestion: null })).toBe('rojo')
    expect(
      semaforoCartera({
        diasParaVencer: -1,
        ultimaGestion: { proximoSeguimiento: fechaEnDias(5) },
      }),
    ).toBe('rojo')
  })

  it('is rojo when it expires in under 15 days and there is no gestión at all', () => {
    expect(semaforoCartera({ diasParaVencer: 10, ultimaGestion: null })).toBe('rojo')
  })

  it('is rojo when it expires in under 15 days and the last gestión has no proximoSeguimiento', () => {
    expect(
      semaforoCartera({ diasParaVencer: 10, ultimaGestion: { proximoSeguimiento: null } }),
    ).toBe('rojo')
  })

  it('is rojo when it expires in under 15 days and the proximoSeguimiento already passed', () => {
    expect(
      semaforoCartera({
        diasParaVencer: 10,
        ultimaGestion: { proximoSeguimiento: fechaEnDias(-2) },
      }),
    ).toBe('rojo')
  })

  it('is amarillo when it expires in under 15 days but there is a gestión with a future seguimiento', () => {
    expect(
      semaforoCartera({
        diasParaVencer: 10,
        ultimaGestion: { proximoSeguimiento: fechaEnDias(3) },
      }),
    ).toBe('amarillo')
  })

  it('is amarillo when it expires between 15 and 30 days, regardless of gestión', () => {
    expect(semaforoCartera({ diasParaVencer: 25, ultimaGestion: null })).toBe('amarillo')
  })

  it('is verde when it expires in 30+ days', () => {
    expect(semaforoCartera({ diasParaVencer: 31, ultimaGestion: null })).toBe('verde')
    expect(semaforoCartera({ diasParaVencer: 300, ultimaGestion: null })).toBe('verde')
  })
})
