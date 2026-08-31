// Pauta real "Retroalimentación del Proceso de Coaching" que el coach hoy manda a llenar en
// Word al cerrar un ciclo — 18 afirmaciones (escala 1-5) agrupadas en 3 bloques + 4 preguntas
// abiertas. Catálogo fijo: no cambia por coachee, así que vive acá y no en la base de datos
// (solo se guarda la respuesta {bloque, afirmacion, valor} por afirmación).
export interface PreguntaRetroalimentacion {
  bloque: string
  afirmacion: string
}

export const PREGUNTAS_RETROALIMENTACION: PreguntaRetroalimentacion[] = [
  // Evaluación del Proceso
  { bloque: 'Evaluación del Proceso', afirmacion: 'El objetivo fue definido con claridad.' },
  { bloque: 'Evaluación del Proceso', afirmacion: 'Se lograron el/los objetivos definidos para el periodo.' },
  {
    bloque: 'Evaluación del Proceso',
    afirmacion:
      'El plan de acción reflejó con claridad las actividades necesarias para lograr el objetivo. Era claro, específico, alcanzable y con fechas definidas.',
  },
  {
    bloque: 'Evaluación del Proceso',
    afirmacion: 'Las herramientas utilizadas durante el proceso fueron efectivas, aportando al proceso y logro de objetivos.',
  },
  { bloque: 'Evaluación del Proceso', afirmacion: 'El Coachee ejecutó en gran medida las actividades comprometidas para el periodo.' },
  {
    bloque: 'Evaluación del Proceso',
    afirmacion: 'El Coachee estableció maneras en cómo hará perdurables/sostenibles los aprendizajes y logros alcanzados.',
  },
  // El Coach
  { bloque: 'El Coach', afirmacion: 'Facilitó/ayudó a que el Coachee definiera su objetivo y plan para lograrlo.' },
  { bloque: 'El Coach', afirmacion: 'Impulsó la confianza en sí mismo del Coachee.' },
  { bloque: 'El Coach', afirmacion: 'Se comportó siempre respetuosamente.' },
  {
    bloque: 'El Coach',
    afirmacion: 'Realizó preguntas pertinentes, poderosas, que permitieron expandir las posibilidades del coachee.',
  },
  { bloque: 'El Coach', afirmacion: 'Demostró escuchar de manera empática.' },
  { bloque: 'El Coach', afirmacion: 'Se mantiene tranquilo y da tiempo al coachee para pensar sus respuestas.' },
  {
    bloque: 'El Coach',
    afirmacion: 'Se comporta como un socio, apoyando al coachee en sus elecciones sobre lo que debe suceder en la sesión.',
  },
  { bloque: 'El Coach', afirmacion: 'Fue asertivo en sus comentarios, ejemplos y en general en todas sus intervenciones.' },
  // Coordinación de sesiones y otros aspectos
  { bloque: 'Coordinación de sesiones y otros aspectos', afirmacion: 'Se ejecutaron todas las sesiones programadas.' },
  {
    bloque: 'Coordinación de sesiones y otros aspectos',
    afirmacion: 'El Coach inició las sesiones puntualmente o en caso de inconveniente avisó oportunamente.',
  },
  {
    bloque: 'Coordinación de sesiones y otros aspectos',
    afirmacion: 'Las sesiones tuvieron la duración acordada (entre 50 y 80 minutos aproximadamente).',
  },
  {
    bloque: 'Coordinación de sesiones y otros aspectos',
    afirmacion: 'Las sesiones se desarrollaron en un ambiente físico o virtual que facilitaba conversar con tranquilidad y fluidez.',
  },
]

export const BLOQUES_RETROALIMENTACION = [
  'Evaluación del Proceso',
  'El Coach',
  'Coordinación de sesiones y otros aspectos',
] as const

export function preguntasDelBloque(bloque: string): PreguntaRetroalimentacion[] {
  return PREGUNTAS_RETROALIMENTACION.filter((p) => p.bloque === bloque)
}
