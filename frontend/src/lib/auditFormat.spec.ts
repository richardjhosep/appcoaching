import { describe, it, expect } from 'vitest'
import { verboAuditoria } from './auditFormat'
import type { AuditLog } from '../api/audit'

function log(overrides: Partial<AuditLog>): AuditLog {
  return {
    id: 'log-1',
    userId: 'u1',
    action: 'LOGIN_SUCCESS',
    targetType: null,
    targetId: null,
    actorLabel: 'Coach (coach@test.com)',
    targetLabel: null,
    metadata: null,
    createdAt: '2026-07-10T09:12:00.000Z',
    ...overrides,
  }
}

describe('verboAuditoria', () => {
  it('formats PLAN_APROBADO with the resolved target name', () => {
    expect(
      verboAuditoria(log({ action: 'PLAN_APROBADO', targetLabel: 'Rodrigo Peña' })),
    ).toBe('Aprobó el plan de desarrollo de Rodrigo Peña.')
  })

  it('falls back to a generic phrase when the target was not resolved', () => {
    expect(verboAuditoria(log({ action: 'PLAN_APROBADO', targetLabel: null }))).toBe(
      'Aprobó el plan de desarrollo de un coachee.',
    )
  })

  it('formats PLAN_CAMBIOS_SOLICITADOS', () => {
    expect(
      verboAuditoria(
        log({ action: 'PLAN_CAMBIOS_SOLICITADOS', targetLabel: 'Rodrigo Peña' }),
      ),
    ).toBe('Solicitó cambios al plan de desarrollo de Rodrigo Peña.')
  })

  it('appends the resultado label for CICLO_CERRADO', () => {
    expect(
      verboAuditoria(
        log({
          action: 'CICLO_CERRADO',
          targetLabel: 'Rodrigo Peña',
          metadata: { resultado: 'medianamente_logrado' },
        }),
      ),
    ).toBe('Cerró el ciclo de coaching de Rodrigo Peña (resultado: medianamente logrado).')
  })

  it('formats LOGIN_FAILED with the attempted email', () => {
    expect(
      verboAuditoria(log({ action: 'LOGIN_FAILED', metadata: { email: 'x@x.com' } })),
    ).toBe('Intento de inicio de sesión fallido (x@x.com).')
  })

  it('formats LOGIN_SUCCESS and LOGOUT without a target', () => {
    expect(verboAuditoria(log({ action: 'LOGIN_SUCCESS' }))).toBe('Inició sesión.')
    expect(verboAuditoria(log({ action: 'LOGOUT' }))).toBe('Cerró sesión.')
  })

  it('formats USER_CREATED with the role', () => {
    expect(
      verboAuditoria(
        log({
          action: 'USER_CREATED',
          targetLabel: 'nueva@empresa.com',
          metadata: { role: 'empresa' },
        }),
      ),
    ).toBe('Creó la cuenta de nueva@empresa.com (empresa).')
  })

  it('formats the account-management actions with the target label', () => {
    expect(verboAuditoria(log({ action: 'PASSWORD_CHANGED' }))).toBe('Cambió su contraseña.')
    expect(
      verboAuditoria(log({ action: 'USER_ACTIVADO', targetLabel: 'ana@test.com' })),
    ).toBe('Activó la cuenta de ana@test.com.')
    expect(
      verboAuditoria(log({ action: 'USER_DESACTIVADO', targetLabel: 'ana@test.com' })),
    ).toBe('Desactivó la cuenta de ana@test.com.')
    expect(
      verboAuditoria(log({ action: 'USER_ELIMINADO', targetLabel: 'ana@test.com' })),
    ).toBe('Eliminó la cuenta de ana@test.com.')
    expect(
      verboAuditoria(log({ action: 'PASSWORD_RESET', targetLabel: 'ana@test.com' })),
    ).toBe('Restableció la contraseña de ana@test.com.')
  })

  it('formats the deletion actions using the label captured before the row was removed', () => {
    expect(
      verboAuditoria(log({ action: 'EMPRESA_ELIMINADA', targetLabel: 'Andes Minerals' })),
    ).toBe('Eliminó la empresa Andes Minerals.')
    expect(
      verboAuditoria(log({ action: 'COACHEE_ELIMINADO', targetLabel: 'Rodrigo Peña' })),
    ).toBe('Eliminó al coachee Rodrigo Peña.')
  })

  it('spells out that the name is missing for deletions from before labels were captured, instead of a bare dash', () => {
    expect(
      verboAuditoria(log({ action: 'EMPRESA_ELIMINADA', targetLabel: null })),
    ).toBe('Eliminó la empresa (nombre no disponible).')
    expect(
      verboAuditoria(log({ action: 'COACHEE_ELIMINADO', targetLabel: null })),
    ).toBe('Eliminó al coachee (nombre no disponible).')
  })

  it('formats DOCUMENTO_LEGAL_ACTUALIZADO for a contrato and an nda', () => {
    expect(
      verboAuditoria(
        log({
          action: 'DOCUMENTO_LEGAL_ACTUALIZADO',
          targetLabel: 'Andes Minerals',
          metadata: { tipo: 'contrato', estado: 'firmado' },
        }),
      ),
    ).toBe('Marcó el Contrato de Andes Minerals como firmado.')
    expect(
      verboAuditoria(
        log({
          action: 'DOCUMENTO_LEGAL_ACTUALIZADO',
          targetLabel: 'Rodrigo Peña',
          metadata: { tipo: 'nda', estado: 'pendiente' },
        }),
      ),
    ).toBe('Marcó el NDA de Rodrigo Peña como pendiente.')
  })

  it('formats DOCUMENTO_ADICIONAL_SUBIDO with the título', () => {
    expect(
      verboAuditoria(
        log({
          action: 'DOCUMENTO_ADICIONAL_SUBIDO',
          targetLabel: 'Andes Minerals',
          metadata: { titulo: 'Correo de aprobación' },
        }),
      ),
    ).toBe('Adjuntó "Correo de aprobación" a Andes Minerals.')
  })

  it('formats CONSENTIMIENTO_ACTUALIZADO for both registrar and revocar, when set manually by the coach', () => {
    expect(
      verboAuditoria(
        log({
          action: 'CONSENTIMIENTO_ACTUALIZADO',
          targetLabel: 'Rodrigo Peña',
          metadata: { informado: true, via: 'manual' },
        }),
      ),
    ).toBe('Registró el consentimiento informado de Rodrigo Peña.')
    expect(
      verboAuditoria(
        log({
          action: 'CONSENTIMIENTO_ACTUALIZADO',
          targetLabel: 'Rodrigo Peña',
          metadata: { informado: false, via: 'manual' },
        }),
      ),
    ).toBe('Revocó el consentimiento informado de Rodrigo Peña.')
  })

  it('falls back to the manual phrasing when via is missing (old logs predating this field)', () => {
    expect(
      verboAuditoria(
        log({
          action: 'CONSENTIMIENTO_ACTUALIZADO',
          targetLabel: 'Rodrigo Peña',
          metadata: { informado: true },
        }),
      ),
    ).toBe('Registró el consentimiento informado de Rodrigo Peña.')
  })

  it('formats CONSENTIMIENTO_ACTUALIZADO as self-attested when the coachee confirmed it themselves by email', () => {
    expect(
      verboAuditoria(
        log({
          action: 'CONSENTIMIENTO_ACTUALIZADO',
          actorLabel: 'Coachee Rodrigo Peña',
          targetLabel: 'Rodrigo Peña',
          metadata: { informado: true, via: 'email' },
        }),
      ),
    ).toBe('Confirmó su consentimiento informado (por correo).')
    expect(
      verboAuditoria(
        log({
          action: 'CONSENTIMIENTO_ACTUALIZADO',
          actorLabel: 'Coachee Rodrigo Peña',
          targetLabel: 'Rodrigo Peña',
          metadata: { informado: false, via: 'email' },
        }),
      ),
    ).toBe('Rechazó el consentimiento informado (por correo).')
  })

  it('formats SOLICITUD_CONSENTIMIENTO_ENVIADA', () => {
    expect(
      verboAuditoria(
        log({ action: 'SOLICITUD_CONSENTIMIENTO_ENVIADA', targetLabel: 'Rodrigo Peña' }),
      ),
    ).toBe('Envió una solicitud de consentimiento informado a Rodrigo Peña.')
  })

  it('falls back to the raw action string for unmapped actions, never throwing', () => {
    expect(verboAuditoria(log({ action: 'ALGO_NUEVO_NO_MAPEADO' }))).toBe(
      'ALGO_NUEVO_NO_MAPEADO',
    )
  })
})
