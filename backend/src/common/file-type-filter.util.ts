import { BadRequestException } from '@nestjs/common';
import { open, unlink } from 'fs/promises';
import { join } from 'path';
import type { Request } from 'express';

type MulterFileFilter = (
  req: Request,
  file: Express.Multer.File,
  callback: (error: Error | null, acceptFile: boolean) => void,
) => void;

/**
 * multer sólo mira el `Content-Type` que el cliente decide mandar — un archivo
 * malicioso renombrado/spoofeado pasa igual si no se valida acá. No es prueba de
 * contenido (eso lo hace `validarPdfSubido` para los casos más sensibles — legal,
 * informes), pero corta de entrada cualquier tipo fuera de la lista permitida antes
 * de que el archivo siquiera se escriba a disco.
 */
export function soloPermitir(
  mimetypesPermitidos: readonly string[],
): MulterFileFilter {
  return (_req, file, callback) => {
    if (!mimetypesPermitidos.includes(file.mimetype)) {
      callback(
        new BadRequestException(
          `Tipo de archivo no permitido (${file.mimetype}).`,
        ),
        false,
      );
      return;
    }
    callback(null, true);
  };
}

export const MIMETYPES_PDF = ['application/pdf'] as const;

export const MIMETYPES_RECURSO = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'video/mp4',
  'video/quicktime',
  'video/x-msvideo',
  'video/webm',
] as const;

const PDF_MAGIC_BYTES = Buffer.from('%PDF-');

/**
 * Verifica el contenido real ya escrito a disco (los primeros bytes), no el mimetype
 * que declaró el cliente. Si no es un PDF de verdad, borra el archivo (no dejar basura
 * huérfana en /uploads) y lanza — se usa en los casos donde un archivo disfrazado de
 * PDF sería más dañino: documentos legales e informes de ciclo, que el coach reabre
 * después confiando en que son PDF.
 */
export async function validarPdfSubido(
  archivo: { filename: string },
  uploadsDir: string,
): Promise<void> {
  const ruta = join(uploadsDir, archivo.filename);

  const buffer = Buffer.alloc(PDF_MAGIC_BYTES.length);
  const handle = await open(ruta, 'r');
  try {
    await handle.read(buffer, 0, buffer.length, 0);
  } finally {
    await handle.close();
  }

  if (!buffer.equals(PDF_MAGIC_BYTES)) {
    await unlink(ruta).catch(() => {
      // Si ni siquiera se pudo borrar, igual seguimos: lo importante es no aceptarlo.
    });
    throw new BadRequestException(
      'El archivo no es un PDF válido (el contenido no coincide con la extensión).',
    );
  }
}
