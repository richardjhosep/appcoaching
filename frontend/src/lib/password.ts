const HAS_LOWERCASE = /[a-z]/
const HAS_UPPERCASE = /[A-Z]/
const HAS_DIGIT = /\d/
const HAS_SPECIAL = /[^A-Za-z0-9]/

export interface PasswordRule {
  label: string
  passes: boolean
}

export function passwordRules(password: string): PasswordRule[] {
  return [
    { label: 'Mínimo 12 caracteres', passes: password.length >= 12 },
    { label: 'Al menos una letra mayúscula', passes: HAS_UPPERCASE.test(password) },
    { label: 'Al menos una letra minúscula', passes: HAS_LOWERCASE.test(password) },
    { label: 'Al menos un número', passes: HAS_DIGIT.test(password) },
    { label: 'Al menos un carácter especial (!@#$%...)', passes: HAS_SPECIAL.test(password) },
  ]
}

export type PasswordStrength = 'debil' | 'media' | 'fuerte'

export function passwordStrength(password: string): PasswordStrength {
  const passed = passwordRules(password).filter((r) => r.passes).length
  if (passed <= 2) return 'debil'
  if (passed <= 4) return 'media'
  return 'fuerte'
}

export function validateNewPassword(password: string): string | undefined {
  if (password.length < 12) {
    return 'La contraseña debe tener al menos 12 caracteres.'
  }
  if (!(HAS_LOWERCASE.test(password) && HAS_UPPERCASE.test(password) && HAS_DIGIT.test(password) && HAS_SPECIAL.test(password))) {
    return 'La contraseña debe incluir al menos una mayúscula, una minúscula, un número y un carácter especial.'
  }
  return undefined
}
