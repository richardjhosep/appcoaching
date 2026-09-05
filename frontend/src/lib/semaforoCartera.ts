export type Semaforo = 'rojo' | 'amarillo' | 'verde'

const DIAS_URGENCIA = 15
const DIAS_ATENCION = 30

/**
 * Semáforo de la cartera de empresas: combina cuán cerca está el vencimiento del contrato con
 * si hay una gestión de renovación en curso (mismo criterio de "contrato urgente" que usa el
 * backend en NegocioService.atencionInmediata() — por vencer y sin gestión — expresado acá
 * como 3 niveles para pintar un punto de color en la cartera completa, no solo en el bloque de
 * atención inmediata).
 *
 * - rojo: ya venció, o vence en menos de 15 días y no hay una gestión con seguimiento futuro.
 * - amarillo: vence en menos de 30 días (y no cae en rojo) — hay que tenerlo en el radar.
 * - verde: todo lo demás (sin fecha, vigente, o ya cubierto por una gestión vigente).
 */
export function semaforoCartera(empresa: {
  diasParaVencer: number | null
  ultimaGestion: { proximoSeguimiento: string | null } | null
}): Semaforo {
  const { diasParaVencer, ultimaGestion } = empresa
  if (diasParaVencer === null) return 'verde'
  if (diasParaVencer < 0) return 'rojo'

  const hoy = new Date().toISOString().slice(0, 10)
  const gestionVigente =
    !!ultimaGestion?.proximoSeguimiento && ultimaGestion.proximoSeguimiento >= hoy

  if (diasParaVencer < DIAS_URGENCIA) return gestionVigente ? 'amarillo' : 'rojo'
  if (diasParaVencer < DIAS_ATENCION) return 'amarillo'
  return 'verde'
}
