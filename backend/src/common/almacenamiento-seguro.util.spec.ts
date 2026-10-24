import { mkdtemp, readdir, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { Readable } from 'stream';
import type { Request } from 'express';
import {
  almacenamientoSeguro,
  contenidoCoincideConTipo,
  extensionSegura,
} from './almacenamiento-seguro.util';

describe('almacenamiento seguro de subidas', () => {
  let dir: string;
  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'uploads-'));
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  const subir = (contenido: Buffer, mimetype: string, originalname: string) =>
    new Promise<{ error: unknown; info?: Partial<Express.Multer.File> }>(
      (resolve) => {
        const motor = almacenamientoSeguro(dir, 'foto-');
        const file = {
          stream: Readable.from([contenido]),
          mimetype,
          originalname,
        } as unknown as Express.Multer.File;
        (
          motor as unknown as {
            _handleFile: (
              r: Request,
              f: Express.Multer.File,
              cb: (e?: unknown, i?: Partial<Express.Multer.File>) => void,
            ) => void;
          }
        )._handleFile({} as Request, file, (error, info) =>
          resolve({ error, info }),
        );
      },
    );

  it('ignora la extensión del cliente: un .html declarado como imagen se guarda como .png', async () => {
    const png = Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47]),
      Buffer.alloc(20),
    ]);
    const { error, info } = await subir(png, 'image/png', 'ataque.html');

    expect(error).toBeNull();
    expect(info?.filename).toMatch(/^foto-[0-9a-f-]{36}\.png$/);
  });

  it('rechaza y borra un archivo cuyo contenido no corresponde al tipo declarado', async () => {
    const html = Buffer.from('<html><script>alert(1)</script></html>');
    const { error } = await subir(html, 'image/png', 'x.png');

    expect(error).toMatchObject({ status: 400 });
    expect(await readdir(dir)).toHaveLength(0);
  });

  it('acepta un PDF real y un docx (zip) real', async () => {
    expect(
      (await subir(Buffer.from('%PDF-1.7 ...'), 'application/pdf', 'a.pdf'))
        .error,
    ).toBeNull();
    const docx = Buffer.concat([
      Buffer.from([0x50, 0x4b, 0x03, 0x04]),
      Buffer.alloc(20),
    ]);
    const tipo =
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    expect((await subir(docx, tipo, 'a.docx')).error).toBeNull();
  });

  it('un webp necesita RIFF....WEBP', async () => {
    const ruta = join(dir, 'w.bin');
    await writeFile(
      ruta,
      Buffer.concat([
        Buffer.from('RIFF'),
        Buffer.alloc(4),
        Buffer.from('WEBP'),
      ]),
    );
    expect(await contenidoCoincideConTipo(ruta, 'image/webp')).toBe(true);
    await writeFile(
      ruta,
      Buffer.concat([
        Buffer.from('RIFF'),
        Buffer.alloc(4),
        Buffer.from('WAVE'),
      ]),
    );
    expect(await contenidoCoincideConTipo(ruta, 'image/webp')).toBe(false);
  });

  it('extensionSegura no depende del nombre y tiene un valor por defecto inofensivo', () => {
    expect(extensionSegura('image/jpeg')).toBe('.jpg');
    expect(extensionSegura('text/html')).toBe('.bin');
  });
});
