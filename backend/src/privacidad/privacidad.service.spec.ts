import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrivacidadService } from './privacidad.service';
import { Coachee } from '../coachees/entities/coachee.entity';

function crear(opciones: { coachee?: Partial<Coachee> | null } = {}) {
  const coachee =
    opciones.coachee === undefined
      ? {
          id: 'c1',
          nombre: 'Ana Pérez',
          userId: 'u1',
          fotoPath: null,
          user: { email: 'ana@x.cl' },
        }
      : opciones.coachee;
  const consultas: string[] = [];
  const ds = {
    entityMetadatas: [
      {
        tableName: 'sesiones',
        columns: [{ databaseName: 'id' }],
        foreignKeys: [
          {
            referencedEntityMetadata: { target: Coachee },
            columnNames: ['coachee_id'],
          },
        ],
      },
      {
        tableName: 'otra_cosa',
        columns: [{ databaseName: 'id' }],
        foreignKeys: [
          {
            referencedEntityMetadata: { target: class Otra {} },
            columnNames: ['x_id'],
          },
        ],
      },
    ],
    query: jest.fn((sql: string) => {
      consultas.push(sql);
      if (sql.includes('FROM "coachees"')) {
        return Promise.resolve([
          {
            id: 'c1',
            nombre: 'Ana Pérez',
            token_acceso: 'secreto',
            foto: 'a.jpg',
          },
        ]);
      }
      if (sql.includes('FROM "sesiones"')) {
        return Promise.resolve([
          { id: 's1', password_hash: 'zzz', notas: 'ok' },
        ]);
      }
      return Promise.resolve([]);
    }),
  };
  const users = { removeById: jest.fn().mockResolvedValue(undefined) };
  const notificaciones = { crear: jest.fn().mockResolvedValue(undefined) };
  const service = new PrivacidadService(
    ds as never,
    { findOne: jest.fn().mockResolvedValue(coachee) } as never,
    { find: jest.fn().mockResolvedValue([{ id: 'coach1' }]) } as never,
    users as never,
    notificaciones as never,
  );
  return { service, ds, users, notificaciones, consultas };
}

describe('PrivacidadService', () => {
  it('exporta solo las tablas con FK a coachees y sin columnas secretas', async () => {
    const { service, consultas } = crear();
    const r = await service.exportar('c1');

    expect(r.titular).toEqual({
      id: 'c1',
      nombre: 'Ana Pérez',
      email: 'ana@x.cl',
    });
    expect(Object.keys(r.datos)).toEqual(['coachees', 'sesiones']);
    expect(r.datos.sesiones[0]).toEqual({ id: 's1', notas: 'ok' });
    expect(r.datos.coachees[0]).not.toHaveProperty('token_acceso');
    expect(consultas.some((q) => q.includes('otra_cosa'))).toBe(false);
  });

  it('no suprime si el nombre de confirmación no coincide', async () => {
    const { service, users } = crear();
    await expect(service.suprimir('c1', 'Otra Persona')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(users.removeById).not.toHaveBeenCalled();
  });

  it('suprime borrando el usuario (cascada) cuando el nombre coincide', async () => {
    const { service, users } = crear();
    await service.suprimir('c1', ' Ana Pérez ');
    expect(users.removeById).toHaveBeenCalledWith('u1');
  });

  it('responde 404 si el coachee no existe', async () => {
    const { service } = crear({ coachee: null });
    await expect(service.exportar('nada')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('avisa a los coaches activos cuando el titular pide la supresión', async () => {
    const { service, notificaciones } = crear();
    await service.solicitarSupresion('u1');
    expect(notificaciones.crear).toHaveBeenCalledTimes(1);
    expect(notificaciones.crear).toHaveBeenCalledWith(
      'coach1',
      expect.anything(),
      expect.stringContaining('Ana Pérez'),
      expect.any(String),
    );
  });
});
