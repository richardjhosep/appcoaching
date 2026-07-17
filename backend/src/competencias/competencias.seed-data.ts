import { NivelCompetencia } from './entities/competencia.entity';

export interface CompetenciaSeed {
  nombre: string;
  definicion: string;
  niveles: NivelCompetencia[];
}

const niveles = (...descripciones: string[]): NivelCompetencia[] =>
  descripciones.map((descripcion, i) => ({ nivel: i + 1, descripcion }));

export const COMPETENCIAS_SEED: CompetenciaSeed[] = [
  {
    nombre: 'Orientación Estratégica',
    definicion:
      'Capacidad de definir una visión futura, anticipar oportunidades y obstáculos, comprender el impacto de decisiones globales en la estrategia y traducirla en acciones estratégicas, tácticas y operativas.',
    niveles: niveles(
      'Entiende la estrategia actual',
      'Alinea las acciones con los objetivos estratégicos',
      'Piensa en términos estratégicos con orientación al futuro.',
      'Alinea la estrategia para el futuro',
      'Entiende el impacto externo sobre la estrategia interna',
      'Alinea acciones para adaptar la estrategia de la empresa a los acontecimientos y tendencias externas.',
    ),
  },
  {
    nombre: 'Búsqueda de Información',
    definicion:
      'Tendencia a explorar el entorno y recopilar información relevante para decisiones futuras; interés por aprender y mantenerse actualizado, asegurando datos completos y precisos para comprender o resolver discrepancias.',
    niveles: niveles(
      'Hace preguntas',
      'Investiga más allá de lo rutinario',
      'Investiga más profundamente',
      'Hace investigación de forma sistemática',
      'Utiliza la información para aprovechar las mejores prácticas',
    ),
  },
  {
    nombre: 'Pensamiento Conceptual',
    definicion:
      'Habilidad de identificar patrones, relaciones y elementos clave en situaciones complejas, entendiendo procesos y elaborando razonamientos creativos y lógicos para conectar ideas no evidentes.',
    niveles: niveles(
      'Utiliza reglas básicas',
      'Observa patrones basándose en la experiencia de la vida',
      'Aplica conceptos complejos',
      'Aclara situaciones o información compleja',
      'Crea nuevos conceptos',
    ),
  },
  {
    nombre: 'Enfoque a Resultados',
    definicion:
      'Orientación a lograr resultados concretos mediante estándares de excelencia, mejora continua e innovación, impulsando desempeño individual y colectivo con evaluaciones constantes de actividades e impacto.',
    niveles: niveles(
      'Se enfoca en hacer bien el trabajo',
      'Crea sus propias medidas de excelencia',
      'Mejora su desempeño',
      'Establece y trabaja para cumplir metas desafiantes',
      'Toma decisiones con base en análisis costo-beneficio',
      'Toma riesgos emprendedores calculados',
    ),
  },
  {
    nombre: 'Orientación al Cliente',
    definicion:
      'Disposición a servir al cliente/usuario alineando prioridades para satisfacer necesidades actuales y futuras; comprender el negocio y procesos para entregar crecimiento, rentabilidad y excelencia operacional centrada en el cliente.',
    niveles: niveles(
      'Responde adecuadamente cuando se le solicita',
      'Inicia y mantiene una comunicación clara y permanente con los clientes/usuarios a fin de anticipar y satisfacer sus necesidades',
      'Se responsabiliza personalmente de ofrecer soluciones y corregir problemas que se le presenten al cliente.',
      'Es consistente en atender y comprometerse con la necesidad de los clientes/usuarios.',
      'Anticipa futuras necesidades de los clientes/usuarios y ejecuta un juicio profundo de negocio al iniciar acciones para satisfacerlas.',
      'Utiliza perspectivas a largo plazo y actúa como un asesor confiable.',
    ),
  },
  {
    nombre: 'Trabajo en Equipo',
    definicion:
      'Capacidad de colaborar y actuar como miembro efectivo del equipo, contribuyendo al cumplimiento de objetivos comunes, promoviendo cooperación, confianza, respeto y valoración de ideas y aportes.',
    niveles: niveles(
      'Trabaja en colaboración con otros',
      'Expresa expectativas positivas sobre el equipo y transmite un sentido de unidad o compromiso mutuo',
      'Persigue el beneficio colectivo antes que el individual',
      'Estimula a los demás que formen parte del equipo',
      'Construye un ambiente de trabajo en equipo dentro de la organización',
    ),
  },
  {
    nombre: 'Impacto e Influencia',
    definicion:
      'Habilidad de persuadir e influir en otros (directa o indirectamente) mediante comunicación efectiva, credibilidad, relaciones y participación, logrando aceptación de ideas y mejoras en la forma de trabajar.',
    niveles: niveles(
      'Expresa tener la intención o el deseo de persuadir',
      'Presenta y expresa ideas de manera clara y convincente para persuadir',
      'Toma múltiples acciones para persuadir o impactar a otros',
      'Calcula el impacto de sus acciones o expresión de sus ideas',
      'Utiliza influencia directa e indirecta',
      'Construye relaciones de apoyo mutuo y un proceso efectivo para convencer o influir en otros',
    ),
  },
  {
    nombre: 'Flexibilidad',
    definicion:
      'Capacidad de ajustar enfoques y acciones ante situaciones, personas o información diversa, adaptándose con apertura a distintos puntos de vista y respondiendo con agilidad a cambios.',
    niveles: niveles(
      'Acepta la necesidad de ser flexible (implica que escucha activamente a otros)',
      'Aplica las reglas/procesos flexiblemente',
      'Adapta las tácticas que lleva el resultado o propósito final',
      'Adapta la estrategia o el objetivo final',
    ),
  },
  {
    nombre: 'Pensamiento Analítico',
    definicion:
      'Capacidad de descomponer problemas en partes, identificar relaciones causa–efecto, patrones y conexiones sistemáticas entre datos o procesos para explicar y resolver situaciones complejas.',
    niveles: niveles(
      'Segmenta los problemas',
      'Reconoce las relaciones básicas de la situación y/o problema',
      'Visualiza relaciones múltiples y conexiones entre los procesos',
      'Hace planes y proyecciones complejas a partir del análisis profundo y formula soluciones integradas',
    ),
  },
  {
    nombre: 'Construye Relaciones de Alianzas de Negocios',
    definicion:
      'Habilidad de desarrollar y mantener redes y relaciones internas/externas clave (socios, clientes, áreas, stakeholders) de forma proactiva para facilitar objetivos de negocio e intercambio de necesidades y perspectivas.',
    niveles: niveles(
      'Reconoce la importancia de establecer redes de contacto estratégicos',
      'Establece intercambio continuo de información con personas clave dentro de la red de contactos',
      'Utiliza la red de contactos para promover las actividades y metas de la organización',
      'Establece y mantiene contacto a nivel personal',
      'Mantiene relaciones de largo plazo con contactos clave que puedan proporcionar recursos y apoyo a la organización',
    ),
  },
  {
    nombre: 'Autoconfianza',
    definicion:
      'Confianza en la propia capacidad para asumir decisiones y desafíos, incluso en contextos difíciles o ambiguos, fortaleciendo el rendimiento personal y aportando visión para el futuro.',
    niveles: niveles(
      'Actúa con confianza en su rol de trabajo, o incluso saliendo un poco de estos si fuera necesario',
      'Actúa confiadamente dentro de los límites del puesto',
      'Demuestra confianza en sus propias habilidades',
      'Asume retos',
      'Escoge situaciones extremadamente desafiantes',
    ),
  },
  {
    nombre: 'Empatía',
    definicion:
      'Capacidad de escuchar y comprender pensamientos, emociones y preocupaciones explícitas o implícitas, respondiendo adecuadamente según el contexto y considerando las necesidades de los demás.',
    niveles: niveles(
      'Entiende la emoción explícita',
      'Reconoce las emociones y preocupaciones de los demás',
      'Interpreta el significado del comportamiento de las personas',
      'Comprende las razones más profundas en las que se basan los patrones de conducta de la persona',
    ),
  },
  {
    nombre: 'Auto Desarrollo',
    definicion:
      'Conciencia de fortalezas y límites y motivación por mejorar continuamente; apertura al aprendizaje, búsqueda de capacitación y responsabilidad activa por el propio crecimiento profesional.',
    niveles: niveles(
      'Busca constantemente retroalimentación para el crecimiento',
      'Persigue el crecimiento o mejora sus acciones',
      'Desarrolla las capacidades necesarias para fortalecer la eficiencia del personal y posibilidades de crecimiento futuro',
      'Persigue Auto-Desarrollo a largo plazo',
    ),
  },
  {
    nombre: 'Desarrollo de Otros',
    definicion:
      'Capacidad de promover el aprendizaje y crecimiento de colaboradores según sus necesidades, fortaleciendo talento futuro, asegurando reemplazos y mejorando oportunidades de rendimiento y mejora continua.',
    niveles: niveles(
      'Expresa expectativas positivas de otros',
      'Da instrucciones de corto plazo, orientadas a la realización del trabajo',
      'Provee soporte constructivo y de apoyo para el desarrollo',
      'Apoya el desarrollo continuo y da retroalimentación para el desarrollo',
      'Promueve el talento, incluso en el largo plazo',
    ),
  },
  {
    nombre: 'Liderazgo de Otros',
    definicion:
      'Capacidad de dirigir equipos, gestionar grupos, delegar, comunicar con claridad y promover participación; asegurar desempeño, cumplimiento de estándares, logro de objetivos y resultados sostenibles.',
    niveles: niveles(
      'Proporciona dirección y recursos; distribuye la carga de trabajo',
      'Mantiene a las personas informadas',
      'Hace posible el desempeño y la efectividad del equipo',
      'Cuida y desarrolla a su equipo',
      'Lidera con el ejemplo',
      'Inspira una visión convincente y compartida',
    ),
  },
  {
    nombre: 'Empodera a Otros',
    definicion:
      'Capacidad de fortalecer autonomía y responsabilidad en otros, entregando apoyo y condiciones para que tomen decisiones, gestionen su trabajo y proyectos con confianza y efectividad.',
    niveles: niveles(
      'Proporciona orientación clara sobre los resultados esperados y los procedimientos',
      'Establece y mantiene límites',
      'Estimula el alto desempeño',
      'Modela las normas de desempeño deseadas y trabaja para que sean visibles.',
      'Toma acciones para fortalecer el desempeño de los demás',
    ),
  },
];
