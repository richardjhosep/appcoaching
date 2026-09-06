import type { EtapaProspecto } from '../api/prospectos'

export const etapaLabel: Record<EtapaProspecto, string> = {
  contactado: 'Contactado',
  propuesta_enviada: 'Propuesta enviada',
  negociacion: 'Negociación',
  ganado: 'Ganado',
  perdido: 'Perdido',
}

/** Mismo criterio sage/bronze/danger de siempre (ver resultadoColor) — el embudo avanza de
 * neutro a cálido a medida que se acerca el cierre, sage cuando se gana, danger cuando se
 * pierde. */
export const etapaColor: Record<EtapaProspecto, string> = {
  contactado: 'var(--color-ink)',
  propuesta_enviada: 'var(--color-bronze)',
  negociacion: 'var(--color-bronze)',
  ganado: 'var(--color-sage)',
  perdido: 'var(--color-danger)',
}

/** Etapas que todavía compiten por convertirse en cliente — usado para filtrar listas de
 * "seguimiento pendiente" y para que el pipeline ponderado del backend y el frontend miren
 * exactamente el mismo conjunto de etapas. */
export const ETAPAS_ABIERTAS: EtapaProspecto[] = ['contactado', 'propuesta_enviada', 'negociacion']

export function etapaEsCerrada(etapa: EtapaProspecto): boolean {
  return etapa === 'ganado' || etapa === 'perdido'
}
