import { describe, it, expect } from 'vitest'
import { formatoPeriodo } from './experienciaCoach'

describe('formatoPeriodo', () => {
  it('shows "actualidad" when fechaFin is null', () => {
    expect(formatoPeriodo('2022-01-15T00:00:00.000Z', null)).toBe('ene 2022 — actualidad')
  })

  it('shows the formatted end date when present', () => {
    expect(formatoPeriodo('2020-06-01T00:00:00.000Z', '2021-12-01T00:00:00.000Z')).toBe('jun 2020 — dic 2021')
  })

  it('does not shift the month for a UTC-midnight date, regardless of the runtime timezone', () => {
    // Un 1° de enero a medianoche UTC, construido como Date y consultado con getMonth() local,
    // se corre a diciembre en cualquier huso horario negativo — acá debe seguir siendo enero.
    expect(formatoPeriodo('2022-01-01T00:00:00.000Z', null)).toBe('ene 2022 — actualidad')
  })
})
