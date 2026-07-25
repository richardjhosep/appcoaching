import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { NotificacionesService } from './notificaciones.service';
import { Notificacion } from './entities/notificacion.entity';
import { TipoNotificacion } from './enums/tipo-notificacion.enum';

type PartialNotificacion = Partial<Notificacion>;

describe('NotificacionesService', () => {
  let service: NotificacionesService;
  let repo: {
    find: jest.Mock<Promise<PartialNotificacion[]>, unknown[]>;
    findOne: jest.Mock<Promise<PartialNotificacion | null>, unknown[]>;
    count: jest.Mock<Promise<number>, unknown[]>;
    create: jest.Mock<PartialNotificacion, [PartialNotificacion]>;
    save: jest.Mock<Promise<PartialNotificacion>, [PartialNotificacion]>;
  };

  beforeEach(() => {
    repo = {
      find: jest.fn<Promise<PartialNotificacion[]>, unknown[]>(),
      findOne: jest.fn<Promise<PartialNotificacion | null>, unknown[]>(),
      count: jest.fn<Promise<number>, unknown[]>(),
      create: jest.fn((data: PartialNotificacion) => data),
      save: jest.fn((data: PartialNotificacion) =>
        Promise.resolve({ id: 'generated-id', ...data }),
      ),
    };
    service = new NotificacionesService(
      repo as unknown as Repository<Notificacion>,
    );
  });

  describe('crear', () => {
    it('saves a notification with the given fields', async () => {
      const notificacion = await service.crear(
        'user-1',
        TipoNotificacion.REAGENDAMIENTO_SOLICITADO,
        'Ana solicitó reagendar su sesión',
        '/coach/comercial',
      );

      expect(notificacion.userId).toBe('user-1');
      expect(notificacion.tipo).toBe(
        TipoNotificacion.REAGENDAMIENTO_SOLICITADO,
      );
      expect(notificacion.mensaje).toBe('Ana solicitó reagendar su sesión');
      expect(notificacion.link).toBe('/coach/comercial');
    });

    it('defaults link to null when not given', async () => {
      const notificacion = await service.crear(
        'user-1',
        TipoNotificacion.REAGENDAMIENTO_RESUELTO,
        'Tu reagendamiento fue resuelto',
      );

      expect(notificacion.link).toBeNull();
    });
  });

  describe('listarPropias', () => {
    it('lists notifications for the user, newest first, limited', async () => {
      repo.find.mockResolvedValue([]);

      await service.listarPropias('user-1');

      expect(repo.find).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        order: { createdAt: 'DESC' },
        take: 20,
      });
    });
  });

  describe('contarNoLeidas', () => {
    it('counts only unread notifications for the user', async () => {
      repo.count.mockResolvedValue(3);

      const count = await service.contarNoLeidas('user-1');

      expect(count).toBe(3);
      expect(repo.count).toHaveBeenCalledWith({
        where: { userId: 'user-1', leida: false },
      });
    });
  });

  describe('marcarLeida', () => {
    it('throws NotFoundException when the notification does not belong to the user', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.marcarLeida('n1', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('marks the notification as read', async () => {
      repo.findOne.mockResolvedValue({ id: 'n1', leida: false });

      const notificacion = await service.marcarLeida('n1', 'user-1');

      expect(notificacion.leida).toBe(true);
    });
  });
});
