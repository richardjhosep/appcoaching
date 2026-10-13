export enum FrecuenciaSerie {
  SEMANAL = 'semanal',
  QUINCENAL = 'quincenal',
  // Mismo día del mes (ej. el 15 de cada mes) — "cada 4 semanas" se cubre con PERSONALIZADA.
  MENSUAL = 'mensual',
  // Cada N semanas (intervaloSemanas).
  PERSONALIZADA = 'personalizada',
}
