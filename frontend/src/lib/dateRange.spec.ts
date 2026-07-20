import { describe, it, expect } from 'vitest'
import { dentroDeRango, hoy, primerDiaDelMes } from './dateRange'

describe('dateRange', () => {
  it('primerDiaDelMes returns the first day of the current month', () => {
    const now = new Date()
    expect(primerDiaDelMes()).toBe(
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`,
    )
  })

  it('hoy returns today in YYYY-MM-DD', () => {
    const now = new Date()
    expect(hoy()).toBe(
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`,
    )
  })

  describe('dentroDeRango', () => {
    it('returns true when the date falls within the range', () => {
      expect(dentroDeRango('2026-01-15T15:00:00.000Z', '2026-01-01', '2026-01-31')).toBe(true)
    })

    it('returns false when the date is before the range', () => {
      expect(dentroDeRango('2025-12-31T15:00:00.000Z', '2026-01-01', '2026-01-31')).toBe(false)
    })

    it('returns false when the date is after the range', () => {
      expect(dentroDeRango('2026-02-01T15:00:00.000Z', '2026-01-01', '2026-01-31')).toBe(false)
    })

    it('treats the range boundaries as inclusive', () => {
      expect(dentroDeRango('2026-01-01T15:00:00.000Z', '2026-01-01', '2026-01-31')).toBe(true)
      expect(dentroDeRango('2026-01-31T15:00:00.000Z', '2026-01-01', '2026-01-31')).toBe(true)
    })

    it('classifies a timestamp by the viewer\'s local calendar day, not the raw UTC date', () => {
      const instant = new Date('2026-01-01T00:00:00.000Z')
      const localDate = `${instant.getFullYear()}-${String(instant.getMonth() + 1).padStart(2, '0')}-${String(instant.getDate()).padStart(2, '0')}`
      // In timezones behind UTC, midnight UTC on Jan 1st is still Dec 31st
      // locally, so it must fall OUTSIDE a Jan 1–31 range; ahead of UTC (or
      // exactly UTC) it stays on Jan 1st and falls INSIDE the range.
      expect(dentroDeRango(instant.toISOString(), '2026-01-01', '2026-01-31')).toBe(localDate >= '2026-01-01')
    })

    it('returns true when there is no date to compare (nothing to exclude)', () => {
      expect(dentroDeRango(undefined, '2026-01-01', '2026-01-31')).toBe(true)
    })

    it('ignores an empty desde or hasta bound', () => {
      expect(dentroDeRango('2020-01-01T00:00:00.000Z', '', '2026-01-31')).toBe(true)
      expect(dentroDeRango('2030-01-01T00:00:00.000Z', '2026-01-01', '')).toBe(true)
    })
  })
})
