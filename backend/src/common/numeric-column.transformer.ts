import { ValueTransformer } from 'typeorm';

// Postgres `numeric` vuelve como string por el driver de pg (evita perder precisión en
// JS), pero el resto del código ya trata todo monto como `number` — sin esto, cada
// columna `numeric` nueva sería un string disfrazado de number en el tipo TS y rompería
// silenciosamente cualquier suma/comparación aguas abajo.
export const numericTransformer: ValueTransformer = {
  to: (value?: number | null) => value,
  from: (value?: string | null) =>
    value === null || value === undefined ? value : parseFloat(value),
};
