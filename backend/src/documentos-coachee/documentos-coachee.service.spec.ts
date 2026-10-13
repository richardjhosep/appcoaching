import { ForbiddenException, NotFoundException } from '@nestjs/common';
import type { Repository } from 'typeorm';
import { DocumentosCoacheeService } from './documentos-coachee.service';
import type { DocumentoCoachee } from './entities/documento-coachee.entity';
import type { CoacheesService } from '../coachees/coachees.service';
import { Role } from '../auth/enums/role.enum';
import { TipoDocumentoCoachee } from './enums/tipo-documento-coachee.enum';
import type { AuthenticatedUser } from '../auth/auth.types';

const coach = { id: 'u-coach', role: Role.COACH } as AuthenticatedUser;
const empresa = {
  id: 'u-emp',
  role: Role.EMPRESA,
  empresaId: 'e1',
} as AuthenticatedUser;
const coachee = { id: 'u-coachee', role: Role.COACHEE } as AuthenticatedUser;

const archivo = {
  filename: 'documento-coachee-x.pdf',
  originalname: 'CV Felipe.pdf',
} as Express.Multer.File;

describe('DocumentosCoacheeService', () => {
  let service: DocumentosCoacheeService;
  let repo: {
    find: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    remove: jest.Mock;
  };
  let coachees: { findByUserId: jest.Mock; findOneForActor: jest.Mock };

  beforeEach(() => {
    repo = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
      create: jest.fn((d: Partial<DocumentoCoachee>) => d),
      save: jest.fn((d: Partial<DocumentoCoachee>) =>
        Promise.resolve({ id: 'doc-1', ...d }),
      ),
      remove: jest.fn(),
    };
    coachees = {
      findByUserId: jest
        .fn()
        .mockResolvedValue({ id: 'c1', userId: 'u-coachee' }),
      findOneForActor: jest.fn().mockResolvedValue({ id: 'c1' }),
    };
    service = new DocumentosCoacheeService(
      repo as unknown as Repository<DocumentoCoachee>,
      coachees as unknown as CoacheesService,
    );
  });

  it('a coachee uploads to their own coachee (resolved from the JWT) and records who uploaded it', async () => {
    const doc = await service.subir(
      coachee,
      { tipo: TipoDocumentoCoachee.CV },
      archivo,
    );

    expect(doc).toEqual(
      expect.objectContaining({
        coacheeId: 'c1',
        tipo: TipoDocumentoCoachee.CV,
        archivoNombre: 'CV Felipe.pdf',
        subidoPorUserId: 'u-coachee',
        subidoPorRol: Role.COACHEE,
      }),
    );
  });

  it("a coachee cannot list another coachee's documents", async () => {
    await expect(service.listar(coachee, 'c-otro')).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('the empresa goes through findOneForActor, which scopes it to its own coachees', async () => {
    coachees.findOneForActor.mockRejectedValue(new ForbiddenException());

    await expect(service.listar(empresa, 'c-de-otra-empresa')).rejects.toThrow(
      ForbiddenException,
    );
    expect(coachees.findOneForActor).toHaveBeenCalledWith(
      'c-de-otra-empresa',
      empresa,
    );
  });

  it('what the empresa uploads is visible to the coachee (same coacheeId, no per-role filter)', async () => {
    await service.listar(coachee);

    expect(repo.find).toHaveBeenCalledWith({
      where: { coacheeId: 'c1' },
      order: { createdAt: 'DESC' },
    });
  });

  it('the coachee cannot delete a document the empresa uploaded', async () => {
    repo.findOne.mockResolvedValue({
      id: 'doc-1',
      coacheeId: 'c1',
      subidoPorUserId: 'u-emp',
      archivoPath: 'x.pdf',
    });

    await expect(service.eliminar(coachee, 'doc-1')).rejects.toThrow(
      ForbiddenException,
    );
    expect(repo.remove).not.toHaveBeenCalled();
  });

  it('the coach can delete any document of the process', async () => {
    repo.findOne.mockResolvedValue({
      id: 'doc-1',
      coacheeId: 'c1',
      subidoPorUserId: 'u-emp',
      archivoPath: 'no-existe-en-disco.pdf',
    });

    await service.eliminar(coach, 'doc-1');

    expect(repo.remove).toHaveBeenCalled();
  });

  it('404 when the document does not exist', async () => {
    repo.findOne.mockResolvedValue(null);

    await expect(service.obtenerParaDescarga(coach, 'nada')).rejects.toThrow(
      NotFoundException,
    );
  });
});
