const MESES_ABREV = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

// Lee año/mes directo del string ISO (los primeros 7 caracteres, "YYYY-MM") en vez de construir
// un `Date` y pedirle el mes/año locales — una fecha `date`-only (medianoche UTC) se corre al
// mes anterior en un huso horario negativo como Chile (mismo tipo de bug que ya se dio con
// `created_at`, ver memoria del proyecto). Trabajar sobre el string evita el problema del todo.
function anioMes(iso: string): { anio: string; mes: number } {
  const [anio, mes] = iso.slice(0, 7).split('-')
  return { anio, mes: Number(mes) }
}

/** Período de una experiencia laboral, estilo LinkedIn: "ene 2022 — actualidad" o
 * "ene 2020 — dic 2021" — `fechaFin` null significa que el coach todavía trabaja ahí. */
export function formatoPeriodo(fechaInicio: string, fechaFin: string | null): string {
  const formato = (iso: string) => {
    const { anio, mes } = anioMes(iso)
    return `${MESES_ABREV[mes - 1]} ${anio}`
  }
  return `${formato(fechaInicio)} — ${fechaFin ? formato(fechaFin) : 'actualidad'}`
}
