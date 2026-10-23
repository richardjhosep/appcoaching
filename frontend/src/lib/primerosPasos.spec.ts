import { describe, it, expect } from 'vitest'
import { primerosPasos } from './primerosPasos'

const coacheeBase = { consentimientoInformado: false, telefono: null, bio: null, fotoPath: null }

describe('primerosPasos', () => {
  it('marks every step pending for a brand-new coachee', () => {
    const pasos = primerosPasos({
      coachee: coacheeBase,
      plan: { estado: 'sin_enviar', objetivoGeneral: null },
      totalSesiones: 0,
    })
    expect(pasos.map((p) => p.id)).toEqual(['consentimiento', 'perfil', 'plan', 'sesion'])
    expect(pasos.every((p) => !p.hecho)).toBe(true)
  })

  it('derives each step from real data', () => {
    const pasos = primerosPasos({
      coachee: { ...coacheeBase, consentimientoInformado: true, bio: 'Hola' },
      plan: { estado: 'pendiente_aprobacion', objetivoGeneral: null },
      totalSesiones: 2,
    })
    expect(pasos.every((p) => p.hecho)).toBe(true)
  })

  it('treats a plan with an objective as done even if not sent', () => {
    const pasos = primerosPasos({
      coachee: null,
      plan: { estado: 'sin_enviar', objetivoGeneral: 'Liderar mejor' },
      totalSesiones: null,
    })
    expect(pasos).toHaveLength(1)
    expect(pasos[0].hecho).toBe(true)
  })

  it('omits steps whose source failed to load', () => {
    expect(primerosPasos({ coachee: null, plan: null, totalSesiones: null })).toEqual([])
  })
})
