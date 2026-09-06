// Semilla inicial de la pauta real "Retroalimentación del Proceso de Coaching" — mismo texto
// que vivía en `frontend/src/lib/retroalimentacionPreguntas.ts` (ver historial de ese archivo),
// ahora movido a la tabla de parametrización para que el coach lo pueda editar desde la UI sin
// depender de un deploy. Solo se inserta si falta (`orIgnore` en el bootstrap) — una vez que
// existe en la base, la base manda: un cambio acá en código NO sobreescribe lo que el coach
// ya haya editado.
//
// Esquema: "RETROALIMENTACION_BLOQUES" es el índice ordenado de los 3 bloques (su `valor` es el
// nombre del bloque); cada nombre de bloque es a su vez un `grupo` con sus afirmaciones en
// orden (`clave` = orden, `valor` = el texto de la afirmación).
export interface ParametroSeed {
  grupo: string;
  clave: string;
  valor: string;
  estado: boolean;
}

const BLOQUE_EVALUACION = 'Evaluación del Proceso';
const BLOQUE_COACH = 'El Coach';
const BLOQUE_COORDINACION = 'Coordinación de sesiones y otros aspectos';

// Categorías de la encuesta de satisfacción que llena la empresa por cada ciclo cerrado — lista
// plana (sin índice de bloques, a diferencia de retroalimentación) porque son solo 3 categorías.
const GRUPO_SATISFACCION_CATEGORIAS = 'SATISFACCION_CATEGORIAS';

// Fuentes de origen de un prospecto (módulo Prospectos) — lista plana editable por el coach,
// igual que las categorías de satisfacción.
const GRUPO_FUENTES_PROSPECTO = 'FUENTES_PROSPECTO';

export const PARAMETROS_SEED: ParametroSeed[] = [
  {
    grupo: 'RETROALIMENTACION_BLOQUES',
    clave: '1',
    valor: BLOQUE_EVALUACION,
    estado: true,
  },
  {
    grupo: 'RETROALIMENTACION_BLOQUES',
    clave: '2',
    valor: BLOQUE_COACH,
    estado: true,
  },
  {
    grupo: 'RETROALIMENTACION_BLOQUES',
    clave: '3',
    valor: BLOQUE_COORDINACION,
    estado: true,
  },

  // Evaluación del Proceso
  {
    grupo: BLOQUE_EVALUACION,
    clave: '1',
    valor: 'El objetivo fue definido con claridad.',
    estado: true,
  },
  {
    grupo: BLOQUE_EVALUACION,
    clave: '2',
    valor: 'Se lograron el/los objetivos definidos para el periodo.',
    estado: true,
  },
  {
    grupo: BLOQUE_EVALUACION,
    clave: '3',
    valor:
      'El plan de acción reflejó con claridad las actividades necesarias para lograr el objetivo. Era claro, específico, alcanzable y con fechas definidas.',
    estado: true,
  },
  {
    grupo: BLOQUE_EVALUACION,
    clave: '4',
    valor:
      'Las herramientas utilizadas durante el proceso fueron efectivas, aportando al proceso y logro de objetivos.',
    estado: true,
  },
  {
    grupo: BLOQUE_EVALUACION,
    clave: '5',
    valor:
      'El Coachee ejecutó en gran medida las actividades comprometidas para el periodo.',
    estado: true,
  },
  {
    grupo: BLOQUE_EVALUACION,
    clave: '6',
    valor:
      'El Coachee estableció maneras en cómo hará perdurables/sostenibles los aprendizajes y logros alcanzados.',
    estado: true,
  },

  // El Coach
  {
    grupo: BLOQUE_COACH,
    clave: '1',
    valor:
      'Facilitó/ayudó a que el Coachee definiera su objetivo y plan para lograrlo.',
    estado: true,
  },
  {
    grupo: BLOQUE_COACH,
    clave: '2',
    valor: 'Impulsó la confianza en sí mismo del Coachee.',
    estado: true,
  },
  {
    grupo: BLOQUE_COACH,
    clave: '3',
    valor: 'Se comportó siempre respetuosamente.',
    estado: true,
  },
  {
    grupo: BLOQUE_COACH,
    clave: '4',
    valor:
      'Realizó preguntas pertinentes, poderosas, que permitieron expandir las posibilidades del coachee.',
    estado: true,
  },
  {
    grupo: BLOQUE_COACH,
    clave: '5',
    valor: 'Demostró escuchar de manera empática.',
    estado: true,
  },
  {
    grupo: BLOQUE_COACH,
    clave: '6',
    valor:
      'Se mantiene tranquilo y da tiempo al coachee para pensar sus respuestas.',
    estado: true,
  },
  {
    grupo: BLOQUE_COACH,
    clave: '7',
    valor:
      'Se comporta como un socio, apoyando al coachee en sus elecciones sobre lo que debe suceder en la sesión.',
    estado: true,
  },
  {
    grupo: BLOQUE_COACH,
    clave: '8',
    valor:
      'Fue asertivo en sus comentarios, ejemplos y en general en todas sus intervenciones.',
    estado: true,
  },

  // Coordinación de sesiones y otros aspectos
  {
    grupo: BLOQUE_COORDINACION,
    clave: '1',
    valor: 'Se ejecutaron todas las sesiones programadas.',
    estado: true,
  },
  {
    grupo: BLOQUE_COORDINACION,
    clave: '2',
    valor:
      'El Coach inició las sesiones puntualmente o en caso de inconveniente avisó oportunamente.',
    estado: true,
  },
  {
    grupo: BLOQUE_COORDINACION,
    clave: '3',
    valor:
      'Las sesiones tuvieron la duración acordada (entre 50 y 80 minutos aproximadamente).',
    estado: true,
  },
  {
    grupo: BLOQUE_COORDINACION,
    clave: '4',
    valor:
      'Las sesiones se desarrollaron en un ambiente físico o virtual que facilitaba conversar con tranquilidad y fluidez.',
    estado: true,
  },

  // Satisfacción (empresa, por ciclo cerrado)
  {
    grupo: GRUPO_SATISFACCION_CATEGORIAS,
    clave: '1',
    valor: 'El coach se comunicó de forma clara y oportuna durante el proceso.',
    estado: true,
  },
  {
    grupo: GRUPO_SATISFACCION_CATEGORIAS,
    clave: '2',
    valor: 'Las sesiones y actividades se cumplieron según lo planificado.',
    estado: true,
  },
  {
    grupo: GRUPO_SATISFACCION_CATEGORIAS,
    clave: '3',
    valor:
      'El proceso generó resultados concretos para el coachee y la empresa.',
    estado: true,
  },

  // Fuentes de prospecto
  {
    grupo: GRUPO_FUENTES_PROSPECTO,
    clave: '1',
    valor: 'Referido',
    estado: true,
  },
  {
    grupo: GRUPO_FUENTES_PROSPECTO,
    clave: '2',
    valor: 'LinkedIn',
    estado: true,
  },
  {
    grupo: GRUPO_FUENTES_PROSPECTO,
    clave: '3',
    valor: 'Sitio web',
    estado: true,
  },
  { grupo: GRUPO_FUENTES_PROSPECTO, clave: '4', valor: 'Evento', estado: true },
  { grupo: GRUPO_FUENTES_PROSPECTO, clave: '5', valor: 'Otro', estado: true },
];
