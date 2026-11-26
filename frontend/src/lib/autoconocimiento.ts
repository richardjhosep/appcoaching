import type { SeccionAutoconocimiento } from '../api/autoconocimiento'

export interface DefinicionSeccion {
  key: SeccionAutoconocimiento
  titulo: string
  ayuda: string
  ejemplo: string
  /** Etiqueta corta junto al título; ninguna sección es obligatoria. */
  etiqueta?: string
  /** Solo "energía": la sección tiene dos columnas. */
  columnas?: [string, string]
}

// Orden del documento del cliente: la más sensible (red de apoyo) va al final.
export const SECCIONES_AUTOCONOCIMIENTO: DefinicionSeccion[] = [
  {
    key: 'proposito',
    titulo: 'Mi propósito',
    ayuda: '¿Para qué hago lo que hago?',
    ejemplo: 'Una frase o un párrafo corto.',
    etiqueta: 'Sugerida',
  },
  {
    key: 'fortalezas',
    titulo: 'Mis fortalezas',
    ayuda: 'De 3 a 5 cosas en las que sabes que eres bueno, más allá de lo que pide tu cargo.',
    ejemplo: 'Escuchar, ordenar ideas, enseñar…',
    etiqueta: 'Sugerida',
  },
  {
    key: 'energia',
    titulo: 'Lo que me da energía y lo que me la quita',
    ayuda: 'Dos listas simples.',
    ejemplo: '',
    etiqueta: 'Sugerida',
    columnas: ['Me da energía', 'Me quita energía'],
  },
  {
    key: 'logro',
    titulo: 'Un logro del que me siento orgulloso',
    ayuda: 'Puede ser profesional o personal.',
    ejemplo: '¿Qué pasó y por qué te importa?',
  },
  {
    key: 'valores',
    titulo: 'Mis valores',
    ayuda: '3 o 4 palabras o frases que guían tus decisiones difíciles.',
    ejemplo: 'Honestidad, aprendizaje, familia…',
  },
  {
    key: 'feedback',
    titulo: 'Cómo prefiero recibir feedback',
    ayuda: 'Para que los demás sepan cómo te sirve más.',
    ejemplo: 'Directo y breve, con ejemplos concretos, con tiempo para pensarlo…',
  },
  {
    key: 'vision',
    titulo: 'Cómo me gustaría que me describieran en 2 años',
    ayuda: 'Una visión corta de tu yo futuro.',
    ejemplo: 'Como alguien que…',
  },
  {
    key: 'fuera_del_trabajo',
    titulo: 'Fuera del trabajo',
    ayuda: 'Pasatiempos, pasiones o algo que amas y no tiene nada que ver con tu cargo.',
    ejemplo: 'Cocinar, correr, tocar guitarra…',
  },
  {
    key: 'red_de_apoyo',
    titulo: 'Mi red de apoyo',
    ayuda: 'Quién te acompaña: un mentor, familia, amistades. Escríbelo solo si te hace bien.',
    ejemplo: 'Personas con las que cuentas.',
    etiqueta: 'Totalmente opcional',
  },
]
