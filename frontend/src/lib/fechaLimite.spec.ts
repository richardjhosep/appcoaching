import { describe, it, expect } from 'vitest'
import { aInputDate, fechaLimiteVencida, formatearFechaLimite } from './fechaLimite'

describe('fechaLimite', () => {
  describe('formatearFechaLimite', () => {
    it('returns null when there is no fechaLimite', () => {
      expect(formatearFechaLimite(null)).toBeNull()
    })

    it('formats a date as "Vence: <día> <mes> <año>"', () => {
      expect(formatearFechaLimite('2026-10-15T23:59:00.000Z')).toMatch(/^Vence: /)
    })
  })

  describe('fechaLimiteVencida', () => {
    it('is false when there is no fechaLimite', () => {
      expect(fechaLimiteVencida(null)).toBe(false)
    })

    it('is true for a date in the past', () => {
      expect(fechaLimiteVencida('2020-01-01T00:00:00.000Z')).toBe(true)
    })

    it('is false for a date in the future', () => {
      expect(fechaLimiteVencida('2999-01-01T00:00:00.000Z')).toBe(false)
    })
  })

  describe('aInputDate', () => {
    it('returns an empty string when there is no fechaLimite', () => {
      expect(aInputDate(null)).toBe('')
    })

    it('returns a YYYY-MM-DD string for a given ISO date', () => {
      expect(aInputDate('2026-10-15T12:00:00.000Z')).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })
  })
})
