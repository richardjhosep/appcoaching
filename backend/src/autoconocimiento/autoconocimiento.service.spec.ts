import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { AutoconocimientoService } from './autoconocimiento.service';
import { SeccionAutoconocimientoCoachee } from './entities/seccion-autoconocimiento.entity';
import { SeccionAutoconocimiento } from './enums/seccion-autoconocimiento.enum';
import { CoacheesService } from '../coachees/coachees.service';
import { Role } from '../auth/enums/role.enum';
import type { AuthenticatedUser } from '../auth/auth.types';

const fila = (over: Partial<SeccionAutoconocimientoCoachee> = {}) =>
  ({
    id: 's1',
    coacheeId: 'coachee-1',
    seccion: SeccionAutoconocimiento.PROPOSITO,
    contenido: 'Formar equipos',
    complemento: '',
    compartida: false,
    ...over,
  }) as SeccionAutoconocimientoCoachee;

const actorCoachee = {
  id: 'user-1',
  role: Role.COACHEE,
} as AuthenticatedUser;
const actorCoach = { id: 'coach-1', role: Role.COACH } as AuthenticatedUser;

describe('AutoconocimientoService', () => {
  let repo: { find: jest.Mock; upsert: jest.Mock; findOneByOrFail: jest.Mock };
  let coachees: { findByUserId: jest.Mock; findOneForActor: jest.Mock };
  let service: AutoconocimientoService;

  beforeEach(() => {
    repo = {
      find: jest.fn().mockResolvedValue([fila()]),
      upsert: jest.fn().mockResolvedValue(undefined),
      findOneByOrFail: jest.fn().mockResolvedValue(fila()),
    };
    coachees = {
      findByUserId: jest.fn().mockResolvedValue({ id: 'coachee-1' }),
      findOneForActor: jest.fn().mockResolvedValue({ id: 'coachee-1' }),
    };
    service = new AutoconocimientoService(
      repo as unknown as Repository<SeccionAutoconocimientoCoachee>,
      coachees as unknown as CoacheesService,
    );
  });

  it('el coachee ve todas sus secciones, compartidas o no, sin campos internos', async () => {
    const res = await service.findOwn(actorCoachee);

    expect(repo.find).toHaveBeenCalledWith({
      where: { coacheeId: 'coachee-1' },
    });
    expect(res).toEqual([
      {
        seccion: 'proposito',
        contenido: 'Formar equipos',
        complemento: '',
        compartida: false,
      },
    ]);
  });

  it('en "Ver como" solo se entregan las compartidas', async () => {
    await service.findOwn({ ...actorCoachee, impersonadoPor: 'admin-1' });

    expect(repo.find).toHaveBeenCalledWith({
      where: { coacheeId: 'coachee-1', compartida: true },
    });
  });

  it('el coach solo recibe las compartidas con algo escrito', async () => {
    repo.find.mockResolvedValue([
      fila({ compartida: true }),
      fila({
        seccion: SeccionAutoconocimiento.VALORES,
        contenido: '  ',
        compartida: true,
      }),
    ]);

    const res = await service.findCompartidasDeCoachee('coachee-1', actorCoach);

    expect(repo.find).toHaveBeenCalledWith({
      where: { coacheeId: 'coachee-1', compartida: true },
    });
    expect(res.map((s) => s.seccion)).toEqual(['proposito']);
  });

  it('el coach recibe 404 si el coachee no existe', async () => {
    coachees.findOneForActor.mockRejectedValue(new NotFoundException());

    await expect(
      service.findCompartidasDeCoachee('nada', actorCoach),
    ).rejects.toThrow(NotFoundException);
    expect(repo.find).not.toHaveBeenCalled();
  });

  it('mover el interruptor no toca el texto', async () => {
    await service.updateOwn('user-1', SeccionAutoconocimiento.PROPOSITO, {
      compartida: true,
    });

    expect(repo.upsert).toHaveBeenCalledWith(
      {
        coacheeId: 'coachee-1',
        seccion: 'proposito',
        contenido: undefined,
        complemento: undefined,
        compartida: true,
      },
      ['coacheeId', 'seccion'],
    );
  });

  it('guarda el texto recortado y permite dejarlo vacío', async () => {
    await service.updateOwn('user-1', SeccionAutoconocimiento.ENERGIA, {
      contenido: ' Enseñar ',
      complemento: '',
    });

    expect(repo.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        contenido: 'Enseñar',
        complemento: '',
        compartida: undefined,
      }),
      ['coacheeId', 'seccion'],
    );
  });

  it('lanza NotFoundException si el actor no tiene perfil de coachee', async () => {
    coachees.findByUserId.mockResolvedValue(null);

    await expect(
      service.updateOwn('x', SeccionAutoconocimiento.LOGRO, { contenido: 'a' }),
    ).rejects.toThrow(NotFoundException);
    expect(repo.upsert).not.toHaveBeenCalled();
  });
});
