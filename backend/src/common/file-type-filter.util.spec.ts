import { mkdtemp, writeFile, rm, access } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { BadRequestException } from '@nestjs/common';
import {
  soloPermitir,
  validarPdfSubido,
  MIMETYPES_PDF,
  MIMETYPES_RECURSO,
} from './file-type-filter.util';

describe('soloPermitir', () => {
  function callFilter(
    mimetypesPermitidos: readonly string[],
    mimetype: string,
  ): Promise<{ error: Error | null; accepted: boolean }> {
    return new Promise((resolve) => {
      soloPermitir(mimetypesPermitidos)(
        {} as never,
        { mimetype } as never,
        (error, accepted) => resolve({ error, accepted }),
      );
    });
  }

  it('accepts a mimetype that is in the allow-list', async () => {
    const { error, accepted } = await callFilter(
      MIMETYPES_PDF,
      'application/pdf',
    );
    expect(error).toBeNull();
    expect(accepted).toBe(true);
  });

  it('rejects a mimetype outside the allow-list, with a BadRequestException', async () => {
    const { error, accepted } = await callFilter(MIMETYPES_PDF, 'text/html');
    expect(error).toBeInstanceOf(BadRequestException);
    expect(accepted).toBe(false);
  });

  it('rejects a spoofed mimetype (e.g. an svg dressed as image/png is still checked literally)', async () => {
    const { accepted } = await callFilter(MIMETYPES_PDF, 'image/svg+xml');
    expect(accepted).toBe(false);
  });

  it('accepts every mimetype in the broader recurso allow-list', async () => {
    for (const mimetype of MIMETYPES_RECURSO) {
      const { accepted } = await callFilter(MIMETYPES_RECURSO, mimetype);
      expect(accepted).toBe(true);
    }
  });
});

describe('validarPdfSubido', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'filtro-pdf-'));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('resolves for a file that really starts with the PDF magic bytes', async () => {
    await writeFile(join(dir, 'real.pdf'), '%PDF-1.4\n...contenido...');

    await expect(
      validarPdfSubido({ filename: 'real.pdf' }, dir),
    ).resolves.toBeUndefined();
  });

  it('rejects and deletes a file whose content is not actually a PDF, even if named .pdf', async () => {
    await writeFile(
      join(dir, 'fake.pdf'),
      '<html><script>alert(1)</script></html>',
    );

    await expect(
      validarPdfSubido({ filename: 'fake.pdf' }, dir),
    ).rejects.toThrow(BadRequestException);

    await expect(access(join(dir, 'fake.pdf'))).rejects.toThrow();
  });
});
