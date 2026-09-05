import { describe, it, expect } from 'vitest'
import { distribucionResultadosSegments } from './distribucionResultados'

describe('distribucionResultadosSegments', () => {
  it('returns an empty array when there are no procesos at all', () => {
    const segmentos = distribucionResultadosSegments({ logrado: 0, medianamente_logrado: 0, no_logrado: 0 })

    expect(segmentos).toEqual([])
  })

  it('excludes resultados with zero count', () => {
    const segmentos = distribucionResultadosSegments({ logrado: 3, medianamente_logrado: 0, no_logrado: 0 })

    expect(segmentos).toEqual([{ resultado: 'logrado', count: 3, pct: 100 }])
  })

  it('computes percentages across all 3 resultados, in logrado → medianamente → no_logrado order', () => {
    const segmentos = distribucionResultadosSegments({ logrado: 2, medianamente_logrado: 1, no_logrado: 1 })

    expect(segmentos).toEqual([
      { resultado: 'logrado', count: 2, pct: 50 },
      { resultado: 'medianamente_logrado', count: 1, pct: 25 },
      { resultado: 'no_logrado', count: 1, pct: 25 },
    ])
  })
})
