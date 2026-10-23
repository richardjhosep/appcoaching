import type { Coachee } from '../api/coachees'
import type { EstadoPlan } from '../api/planesDesarrollo'

export interface PrimerPaso {
  id: 'consentimiento' | 'perfil' | 'plan' | 'sesion'
  titulo: string
  detalle: string
  hecho: boolean
  ruta: string
}

/**
 * Checklist "Primeros pasos" del coachee, derivado únicamente de datos reales:
 * consentimiento firmado, perfil con algún dato propio, plan ya trabajado (con objetivo o
 * enviado) y al menos una sesión en su agenda. `coachee`/`plan` en null = no se pudo
 * cargar: ese paso se omite en vez de mostrarse como pendiente por error.
 */
export function primerosPasos(fuentes: {
  coachee: Pick<Coachee, 'consentimientoInformado' | 'telefono' | 'bio' | 'fotoPath'> | null
  plan: { estado: EstadoPlan; objetivoGeneral: string | null } | null
  totalSesiones: number | null
}): PrimerPaso[] {
  const pasos: PrimerPaso[] = []
  const { coachee, plan, totalSesiones } = fuentes

  if (coachee) {
    pasos.push({
      id: 'consentimiento',
      titulo: 'Confirma tu consentimiento informado',
      detalle: 'Es el acuerdo para que tu coach pueda acompañarte.',
      hecho: coachee.consentimientoInformado,
      ruta: 'coachee-cuenta',
    })
    pasos.push({
      id: 'perfil',
      titulo: 'Completa tu perfil',
      detalle: 'Agrega tu teléfono, una foto o unas líneas sobre ti.',
      hecho: !!(coachee.telefono || coachee.bio || coachee.fotoPath),
      ruta: 'coachee-perfil',
    })
  }
  if (plan) {
    pasos.push({
      id: 'plan',
      titulo: 'Define tu plan de desarrollo',
      detalle: 'Escribe tu objetivo general y envíalo a tu coach.',
      hecho: plan.estado !== 'sin_enviar' || !!plan.objetivoGeneral?.trim(),
      ruta: 'coachee-plan',
    })
  }
  if (totalSesiones !== null) {
    pasos.push({
      id: 'sesion',
      titulo: 'Agenda tu primera sesión',
      detalle: 'Pide una hora entre las que tu coach dejó disponibles.',
      hecho: totalSesiones > 0,
      ruta: 'coachee-sesiones',
    })
  }
  return pasos
}
