import { CategoriaRecurso } from './enums/categoria-recurso.enum';

const MIMETYPES_TEXTO = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
]);

const MIMETYPES_VIDEO = new Set([
  'video/mp4',
  'video/quicktime',
  'video/x-msvideo',
  'video/webm',
]);

/**
 * Clasifica un recurso tipo `archivo` por su mimetype REAL (el que multer capturó al
 * subirlo), no por la extensión del nombre — más confiable, porque el nombre lo eligió
 * quien subió el archivo y puede no coincidir con el contenido real.
 */
export function categoriaPorMimetype(
  mimetype: string,
): CategoriaRecurso | null {
  if (MIMETYPES_TEXTO.has(mimetype)) return CategoriaRecurso.TEXTO;
  if (MIMETYPES_VIDEO.has(mimetype)) return CategoriaRecurso.VIDEO;
  if (mimetype.startsWith('audio/')) return CategoriaRecurso.AUDIO;
  return null;
}

/**
 * Un link no tiene mimetype — lo único inferible sin abrir la página es si apunta a una
 * plataforma de video conocida. Cualquier otro link queda sin categoría (null), no se
 * adivina si es "texto" solo porque no es un video.
 */
export function categoriaPorUrl(url: string): CategoriaRecurso | null {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    const esVideo = [
      'youtube.com',
      'youtu.be',
      'm.youtube.com',
      'vimeo.com',
    ].includes(host);
    return esVideo ? CategoriaRecurso.VIDEO : null;
  } catch {
    return null;
  }
}
