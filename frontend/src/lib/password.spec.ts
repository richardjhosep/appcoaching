import { describe, it, expect } from 'vitest'
import { passwordRules, passwordStrength, validateNewPassword } from './password'

describe('validateNewPassword', () => {
  it('rejects passwords shorter than 12 characters', () => {
    expect(validateNewPassword('Abc123!@#')).toBe(
      'La contraseña debe tener al menos 12 caracteres.',
    )
  })

  it('rejects passwords missing a special character', () => {
    expect(validateNewPassword('Abcdefgh1234')).toBe(
      'La contraseña debe incluir al menos una mayúscula, una minúscula, un número y un carácter especial.',
    )
  })

  it('rejects passwords missing an uppercase letter', () => {
    expect(validateNewPassword('abcdefgh1234!')).toBe(
      'La contraseña debe incluir al menos una mayúscula, una minúscula, un número y un carácter especial.',
    )
  })

  it('rejects passwords missing a digit', () => {
    expect(validateNewPassword('Abcdefghijk!')).toBe(
      'La contraseña debe incluir al menos una mayúscula, una minúscula, un número y un carácter especial.',
    )
  })

  it('accepts a password meeting every rule', () => {
    expect(validateNewPassword('Abcdefg123!@')).toBeUndefined()
  })
})

describe('passwordRules', () => {
  it('reports each rule individually', () => {
    const rules = passwordRules('abcdefgh1234')
    expect(rules).toEqual([
      { label: 'Mínimo 12 caracteres', passes: true },
      { label: 'Al menos una letra mayúscula', passes: false },
      { label: 'Al menos una letra minúscula', passes: true },
      { label: 'Al menos un número', passes: true },
      { label: 'Al menos un carácter especial (!@#$%...)', passes: false },
    ])
  })
})

describe('passwordStrength', () => {
  it('is "debil" when 2 or fewer rules pass', () => {
    expect(passwordStrength('abc')).toBe('debil')
    expect(passwordStrength('abcdefghijk')).toBe('debil')
  })

  it('is "media" when 3 or 4 rules pass', () => {
    expect(passwordStrength('abcdefgh1234')).toBe('media')
  })

  it('is "fuerte" when every rule passes', () => {
    expect(passwordStrength('Abcdefg123!@')).toBe('fuerte')
  })
})
