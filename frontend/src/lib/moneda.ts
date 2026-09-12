export type Moneda = 'clp' | 'uf'

const formatoCLP = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })
const formatoUFNumero = new Intl.NumberFormat('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export function formatCLP(monto: number): string {
  return formatoCLP.format(monto)
}

export function formatUF(montoUf: number): string {
  return `${formatoUFNumero.format(montoUf)} UF`
}

/** CLP -> UF, para mostrar un monto (que internamente siempre vive en CLP) en UF. */
export function clpAUf(montoClp: number, valorUf: number): number {
  return valorUf > 0 ? montoClp / valorUf : 0
}

/** UF -> CLP, para el input de tarifa (el coach tipea en UF, se guarda el equivalente). */
export function ufAClp(montoUf: number, valorUf: number): number {
  return Math.round(montoUf * valorUf)
}

/**
 * Formatea un monto que internamente vive en CLP, en la moneda de visualización elegida.
 * Es SOLO display — la conversión a UF nunca se guarda ni se usa para sumar totales.
 */
export function formatMonto(montoClp: number, moneda: Moneda, valorUf: number): string {
  return moneda === 'uf' ? formatUF(clpAUf(montoClp, valorUf)) : formatCLP(montoClp)
}

export function formatoFechaCorta(fecha: string): string {
  return new Date(`${fecha}T00:00:00`).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })
}
