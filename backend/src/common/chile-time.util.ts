// El proceso backend corre con TZ=UTC (ver backend/Dockerfile y el arranque local
// documentado en el proyecto) para que created_at/updated_at queden alineados con la sesión
// UTC de Postgres. Eso significa que `Date.getDay()`/`getHours()` sobre un Date leen en UTC,
// no en horario de Chile — usarlos directo para calcular disponibilidad, fechas límite, etc.
// agendaría/venceria todo mal. Este archivo centraliza la conversión correcta vía
// Intl.DateTimeFormat con la zona horaria explícita (Node trae ICU completo, no depende del
// TZ del proceso), sin hardcodear un offset fijo — Chile ha cambiado la ley de horario de
// verano varias veces. Vive en common/ porque lo usan varios módulos sin relación entre sí
// (sesiones/disponibilidad y, desde acá, fecha límite de contenido de estudio).
const ZONA_HORARIA_COACH = 'America/Santiago';

const DIAS_SEMANA: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

/** Día de la semana (0=domingo..6=sábado) y hora "HH:MM" local de Chile para un instante UTC. */
export function diaYHoraLocalChile(fecha: Date): {
  diaSemana: number;
  hora: string;
} {
  const partes = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: ZONA_HORARIA_COACH,
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(fecha)
      .map((p) => [p.type, p.value]),
  );
  return {
    diaSemana: DIAS_SEMANA[partes.weekday],
    hora: `${partes.hour}:${partes.minute}`,
  };
}

/** Minutos que hay que sumarle a un instante UTC para obtener su hora de pared en Chile. */
function offsetMinutosEnSantiago(fechaUtc: Date): number {
  const partes = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: ZONA_HORARIA_COACH,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
      .formatToParts(fechaUtc)
      .map((p) => [p.type, p.value]),
  );
  const comoSiFueraUtc = Date.UTC(
    Number(partes.year),
    Number(partes.month) - 1,
    Number(partes.day),
    Number(partes.hour),
    Number(partes.minute),
    Number(partes.second),
  );
  return (comoSiFueraUtc - fechaUtc.getTime()) / 60_000;
}

/**
 * Convierte una fecha calendario + hora "HH:MM", ambas en horario de pared de Chile, al
 * instante UTC real que representan. `mes` es 1-12 (no 0-indexado).
 *
 * Limitación conocida y aceptada: usa el offset vigente en una primera aproximación de la
 * fecha pedida para resolverla; puede quedar corrida por el offset de DST (hasta 1h) solo
 * para instantes que caen dentro de la propia ventana de transición de horario de verano —
 * irrelevante para agendar sesiones o fechas límite con días de anticipación.
 */
export function localChileAUtc(
  anio: number,
  mes: number,
  dia: number,
  horaMinuto: string,
): Date {
  const [hora, minuto] = horaMinuto.split(':').map(Number);
  const aproximacion = new Date(Date.UTC(anio, mes - 1, dia, hora, minuto));
  const offset = offsetMinutosEnSantiago(aproximacion);
  return new Date(aproximacion.getTime() - offset * 60_000);
}

/**
 * Convierte una fecha simple "YYYY-MM-DD" (la que manda un <input type="date">) al instante
 * UTC del fin de ese día en horario de Chile (23:59) — para fechas límite: el coach elige
 * "15 de octubre" esperando que el contenido siga visible TODO ese día en Chile, no que
 * desaparezca desde la medianoche UTC (que cae varias horas antes en horario de Chile).
 */
export function finDelDiaChileAUtc(fechaSimple: string): Date {
  const [anio, mes, dia] = fechaSimple.split('-').map(Number);
  return localChileAUtc(anio, mes, dia, '23:59');
}

/** Igual que finDelDiaChileAUtc pero para las 00:00 de ese día — el otro extremo de la ventana. */
export function inicioDelDiaChileAUtc(fechaSimple: string): Date {
  const [anio, mes, dia] = fechaSimple.split('-').map(Number);
  return localChileAUtc(anio, mes, dia, '00:00');
}

/**
 * Fecha calendario "YYYY-MM-DD" de hoy en horario de Chile — el locale en-CA formatea así de
 * forma nativa, evita armar el string a mano a partir de formatToParts.
 */
export function fechaSimpleHoyChile(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONA_HORARIA_COACH,
  }).format(new Date());
}

/**
 * Suma (o resta) días de calendario a una fecha simple "YYYY-MM-DD" — aritmética de fecha
 * pura, sin huso horario (no confundir con instantes UTC).
 */
export function sumarDiasFechaSimple(
  fechaSimple: string,
  dias: number,
): string {
  const [anio, mes, dia] = fechaSimple.split('-').map(Number);
  const fecha = new Date(Date.UTC(anio, mes - 1, dia + dias));
  return `${fecha.getUTCFullYear()}-${String(fecha.getUTCMonth() + 1).padStart(2, '0')}-${String(fecha.getUTCDate()).padStart(2, '0')}`;
}
