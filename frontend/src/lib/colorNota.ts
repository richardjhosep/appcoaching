// Paleta fija para las notas de la pizarra personal — deliberadamente distinta del set
// sage/bronze/danger del resto del sistema de diseño (ver resultadoColor, etapaColor): ese set
// comunica estado; esto es contenido decorativo personal, así que se permiten tonos pastel
// tipo post-it que no tienen equivalente entre las variables CSS del tema.
export const COLORES_NOTA = ['#fef3c7', '#fecdd3', '#bfdbfe', '#bbf7d0', '#e9d5ff'] as const

export const COLOR_NOTA_POR_DEFECTO: string = COLORES_NOTA[0]
