import { BadRequestException } from '@nestjs/common';
import { createWriteStream } from 'fs';
import { open, unlink } from 'fs/promises';
import { basename, extname, join } from 'path';
import { randomUUID } from 'crypto';
import type { Request, Response } from 'express';
import type { StorageEngine } from 'multer';

// Extensión que se guarda según el tipo (mimetype) ya validado por soloPermitir — nunca la del
// nombre que manda el cliente: un "x.html" subido como image/png se guardaba como .html y luego
// se servía como HTML desde el mismo origen de la app.
const EXTENSION_POR_MIMETYPE: Record<string, string> = {
  'application/pdf': '.pdf',
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    '.docx',
  'application/vnd.ms-excel': '.xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
  'text/csv': '.csv',
  'video/mp4': '.mp4',
  'video/quicktime': '.mov',
  'video/x-msvideo': '.avi',
  'video/webm': '.webm',
  'audio/mpeg': '.mp3',
  'audio/mp4': '.m4a',
  'audio/x-m4a': '.m4a',
  'audio/wav': '.wav',
  'audio/x-wav': '.wav',
  'audio/ogg': '.ogg',
  'audio/webm': '.weba',
};

export function extensionSegura(mimetype: string): string {
  return EXTENSION_POR_MIMETYPE[mimetype] ?? '.bin';
}

interface Firma {
  offset: number;
  bytes: Buffer;
}

const ZIP = [{ offset: 0, bytes: Buffer.from([0x50, 0x4b, 0x03, 0x04]) }];
const OLE = [
  {
    offset: 0,
    bytes: Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]),
  },
];
const FTYP = [{ offset: 4, bytes: Buffer.from('ftyp') }];

// Primeros bytes que debe tener cada formato. Los tipos sin firma estable (csv, avi/webm/ogg,
// wav/mp3 con o sin etiquetas) no se verifican por contenido; igual quedan con extensión fija
// y se sirven como descarga, así que no pueden ejecutarse como página.
const FIRMAS: Record<string, readonly Firma[][]> = {
  'application/pdf': [[{ offset: 0, bytes: Buffer.from('%PDF-') }]],
  'image/jpeg': [[{ offset: 0, bytes: Buffer.from([0xff, 0xd8, 0xff]) }]],
  'image/png': [[{ offset: 0, bytes: Buffer.from([0x89, 0x50, 0x4e, 0x47]) }]],
  'image/webp': [
    [
      { offset: 0, bytes: Buffer.from('RIFF') },
      { offset: 8, bytes: Buffer.from('WEBP') },
    ],
  ],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
    ZIP,
  ],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [ZIP],
  'application/msword': [OLE],
  'application/vnd.ms-excel': [OLE],
  'video/mp4': [FTYP],
  'video/quicktime': [FTYP],
  'audio/mp4': [FTYP],
  'audio/x-m4a': [FTYP],
};

export async function contenidoCoincideConTipo(
  ruta: string,
  mimetype: string,
): Promise<boolean> {
  const alternativas = FIRMAS[mimetype];
  if (!alternativas) {
    return true;
  }
  const handle = await open(ruta, 'r');
  try {
    const cabecera = Buffer.alloc(16);
    await handle.read(cabecera, 0, cabecera.length, 0);
    return alternativas.some((firmas) =>
      firmas.every(({ offset, bytes }) =>
        cabecera.subarray(offset, offset + bytes.length).equals(bytes),
      ),
    );
  } finally {
    await handle.close();
  }
}

/**
 * Reemplaza a multer.diskStorage en todas las subidas: el servidor decide el nombre y la
 * extensión (por el tipo permitido, no por el nombre del cliente) y, una vez escrito el archivo,
 * comprueba que sus primeros bytes correspondan al tipo declarado. Si no, lo borra y rechaza.
 */
export function almacenamientoSeguro(
  destino: string,
  prefijo = '',
): StorageEngine {
  return {
    _handleFile(
      _req: Request,
      file: Express.Multer.File,
      callback: (error?: unknown, info?: Partial<Express.Multer.File>) => void,
    ) {
      const filename = `${prefijo}${randomUUID()}${extensionSegura(file.mimetype)}`;
      const ruta = join(destino, filename);
      const salida = createWriteStream(ruta);

      file.stream.pipe(salida);
      salida.on('error', callback);
      salida.on('finish', () => {
        void contenidoCoincideConTipo(ruta, file.mimetype)
          .then(async (coincide) => {
            if (!coincide) {
              await unlink(ruta).catch(() => undefined);
              callback(
                new BadRequestException(
                  'El contenido del archivo no coincide con su tipo.',
                ),
              );
              return;
            }
            callback(null, {
              destination: destino,
              filename,
              path: ruta,
              size: salida.bytesWritten,
            });
          })
          .catch(callback);
      });
    },
    _removeFile(
      _req: Request,
      file: Express.Multer.File,
      callback: (error: Error | null) => void,
    ) {
      unlink(file.path).then(
        () => callback(null),
        () => callback(null),
      );
    },
  };
}

// Solo estos formatos se muestran dentro de la página (foto, logo, PDF); cualquier otro —por
// ejemplo un archivo antiguo con extensión .html— se entrega como descarga.
const EN_LINEA = new Set(['.jpg', '.jpeg', '.png', '.webp', '.pdf']);

export function enviarArchivoSeguro(res: Response, ruta: string): void {
  if (!EN_LINEA.has(extname(ruta).toLowerCase())) {
    res.attachment(basename(ruta));
  }
  // Aunque algo se abriera como documento, no puede ejecutar scripts ni cargar recursos.
  res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.sendFile(ruta);
}
