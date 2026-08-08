import type { DocumentoLegal, ResumenLegal } from '../api/legal'

export type EstadoVisualDocumento = 'firmado' | 'pendiente' | 'vencido'

/**
 * Estado que se le muestra al coach, derivado en el momento (no persistido):
 * "vencido" no es un estado propio del backend — es "firmado" cuya vigencia
 * ya pasó. Nunca depende de si `fecha` está presente, solo de `estado` (y de
 * `vigencia` para el caso vencido) — evita la incongruencia pill/texto donde
 * un documento marcado Firmado sin fecha aparecía como "Sin firmar todavía".
 */
export function estadoVisual(doc: DocumentoLegal, hoy: Date = new Date()): EstadoVisualDocumento {
  if (doc.estado !== 'firmado') return 'pendiente'
  if (doc.vigencia && new Date(`${doc.vigencia}T00:00:00`) < hoy) return 'vencido'
  return 'firmado'
}

export const ESTADO_VISUAL_LABEL: Record<EstadoVisualDocumento, string> = {
  firmado: 'Firmado',
  pendiente: 'Pendiente',
  vencido: 'Vencido',
}

export const ESTADO_VISUAL_COLOR: Record<EstadoVisualDocumento, { bg: string; texto: string }> = {
  firmado: { bg: 'bg-[var(--color-sage)]/20', texto: 'text-[var(--color-sage)]' },
  pendiente: { bg: 'bg-[var(--color-danger)]/15', texto: 'text-[var(--color-danger)]' },
  vencido: { bg: 'bg-[var(--color-bronze)]/20', texto: 'text-[var(--color-bronze)]' },
}

export interface AlertasLegales {
  contratosPendientes: number
  ndaPendientes: number
  vencidos: number
  sinConsentimiento: number
}

/**
 * Cuenta lo que necesita atención del coach en Legal — usado tanto por la pestaña Contratos
 * (para su franja de alertas) como por el Dashboard (para que esas mismas alertas sean visibles
 * sin tener que entrar a Legal), así nunca muestran números distintos entre pantallas.
 */
export function alertasLegales(resumen: ResumenLegal): AlertasLegales {
  const relaciones = [...resumen.empresas, ...resumen.independientes]
  const todosLosDocumentos = relaciones.flatMap((r) => [r.contrato, r.nda])

  const contratosPendientes = relaciones.filter((r) => estadoVisual(r.contrato) === 'pendiente').length
  const ndaPendientes = relaciones.filter((r) => estadoVisual(r.nda) === 'pendiente').length
  const vencidos = todosLosDocumentos.filter((d) => estadoVisual(d) === 'vencido').length
  const sinConsentimiento =
    resumen.empresas.reduce((acc, e) => acc + (e.coacheesTotal - e.coacheesConConsentimiento), 0) +
    resumen.independientes.filter((i) => !i.consentimientoInformado).length

  return { contratosPendientes, ndaPendientes, vencidos, sinConsentimiento }
}

export function totalAlertasLegales(alertas: AlertasLegales): number {
  return alertas.contratosPendientes + alertas.ndaPendientes + alertas.vencidos + alertas.sinConsentimiento
}
