import { describe, it, expect } from 'vitest'
import { iniciales } from './avatar'

describe('iniciales', () => {
  it('takes the first letter of the first and last name', () => {
    expect(iniciales('Ana Reagenda')).toBe('AR')
  })

  it('uses only the first letter for a single-word name', () => {
    expect(iniciales('Prince')).toBe('P')
  })

  it('ignores extra middle names, using only first and last', () => {
    expect(iniciales('Juan Carlos Pérez Soto')).toBe('JS')
  })

  it('uppercases regardless of input casing', () => {
    expect(iniciales('ana reagenda')).toBe('AR')
  })

  it('trims surrounding whitespace', () => {
    expect(iniciales('  Ana Reagenda  ')).toBe('AR')
  })
})
