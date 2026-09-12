// Formato del contenido (a diferencia de TipoRecurso, que distingue archivo/link — esto
// distingue texto/audio/video para filtrar en la Biblioteca). Nullable: un link genérico
// (no un video reconocido) no tiene forma de inferirse sin abrir la página.
export enum CategoriaRecurso {
  TEXTO = 'texto',
  AUDIO = 'audio',
  VIDEO = 'video',
}
