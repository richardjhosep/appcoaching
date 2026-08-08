import type { AuditLog } from '../api/audit'

const RESULTADO_LABEL: Record<string, string> = {
  logrado: 'logrado',
  medianamente_logrado: 'medianamente logrado',
  no_logrado: 'no logrado',
}

const ROLE_LABEL: Record<string, string> = {
  coach: 'coach',
  coachee: 'coachee',
  empresa: 'empresa',
}

/**
 * Arma la frase en pasado que describe una entrada de auditoría, sin repetir
 * el actor (se muestra aparte, ej. "10 jul 2026 · 09:12 — Coach (x@x.com) — {verbo}").
 * `default` nunca revienta: cualquier action futura sin mapear cae ahí.
 */
export function verboAuditoria(log: AuditLog): string {
  const target = log.targetLabel
  const metadata = log.metadata ?? {}

  switch (log.action) {
    case 'PLAN_APROBADO':
      return `Aprobó el plan de desarrollo de ${target ?? 'un coachee'}.`
    case 'PLAN_CAMBIOS_SOLICITADOS':
      return `Solicitó cambios al plan de desarrollo de ${target ?? 'un coachee'}.`
    case 'CICLO_CERRADO': {
      const resultado = metadata.resultado as string | undefined
      const sufijo = resultado ? ` (resultado: ${RESULTADO_LABEL[resultado] ?? resultado})` : ''
      return `Cerró el ciclo de coaching de ${target ?? 'un coachee'}${sufijo}.`
    }
    case 'LOGIN_SUCCESS':
      return 'Inició sesión.'
    case 'LOGIN_FAILED': {
      const email = metadata.email as string | undefined
      return `Intento de inicio de sesión fallido${email ? ` (${email})` : ''}.`
    }
    case 'LOGOUT':
      return 'Cerró sesión.'
    case 'USER_CREATED': {
      const role = metadata.role as string | undefined
      const sufijo = role ? ` (${ROLE_LABEL[role] ?? role})` : ''
      return `Creó la cuenta de ${target ?? 'un usuario'}${sufijo}.`
    }
    case 'PASSWORD_CHANGED':
      return 'Cambió su contraseña.'
    case 'USER_ACTIVADO':
      return `Activó la cuenta de ${target ?? 'un usuario'}.`
    case 'USER_DESACTIVADO':
      return `Desactivó la cuenta de ${target ?? 'un usuario'}.`
    case 'USER_ELIMINADO':
      return `Eliminó la cuenta de ${target ?? 'un usuario'}.`
    case 'PASSWORD_RESET':
      return `Restableció la contraseña de ${target ?? 'un usuario'}.`
    case 'EMPRESA_ELIMINADA':
      return `Eliminó la empresa ${target ?? '(nombre no disponible)'}.`
    case 'COACHEE_ELIMINADO':
      return `Eliminó al coachee ${target ?? '(nombre no disponible)'}.`
    case 'DOCUMENTO_LEGAL_ACTUALIZADO': {
      const tipo = metadata.tipo as string | undefined
      const tipoLabel = tipo === 'nda' ? 'NDA' : 'Contrato'
      const estado = metadata.estado as string | undefined
      const estadoLabel = estado === 'firmado' ? 'firmado' : 'pendiente'
      return `Marcó el ${tipoLabel} de ${target ?? 'un coachee'} como ${estadoLabel}.`
    }
    case 'DOCUMENTO_ADICIONAL_SUBIDO': {
      const titulo = metadata.titulo as string | undefined
      return `Adjuntó "${titulo ?? 'un documento'}" a ${target ?? 'un coachee'}.`
    }
    case 'CONSENTIMIENTO_ACTUALIZADO': {
      const informado = metadata.informado as boolean | undefined
      const via = metadata.via as string | undefined
      if (via === 'email') {
        // El actor ya ES el coachee (se autoatestó desde el link del correo) — sin "de {target}" redundante.
        return informado
          ? 'Confirmó su consentimiento informado (por correo).'
          : 'Rechazó el consentimiento informado (por correo).'
      }
      return informado
        ? `Registró el consentimiento informado de ${target ?? 'un coachee'}.`
        : `Revocó el consentimiento informado de ${target ?? 'un coachee'}.`
    }
    case 'SOLICITUD_CONSENTIMIENTO_ENVIADA':
      return `Envió una solicitud de consentimiento informado a ${target ?? 'un coachee'}.`
    default:
      return log.action
  }
}
