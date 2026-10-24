import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { JwtStrategy } from './jwt.strategy';
import { Role } from '../enums/role.enum';
import type { SessionRevocationService } from '../../redis/session-revocation.service';

describe('JwtStrategy', () => {
  let revokedAt: jest.Mock<Promise<number | null>, [string]>;
  let strategy: JwtStrategy;
  const payload = {
    sub: 'u1',
    email: 'a@x.cl',
    role: Role.COACHEE,
    empresaId: null,
    iat: 1_000,
  };
  const req = (method: string, path = '/algo') => ({ method, path }) as Request;

  beforeEach(() => {
    revokedAt = jest.fn<Promise<number | null>, [string]>();
    revokedAt.mockResolvedValue(null);
    strategy = new JwtStrategy(
      { get: () => 'access-secret' } as unknown as ConfigService,
      { revokedAt } as unknown as SessionRevocationService,
    );
  });

  it('lets a Ver como session read (GET) and exposes who is watching', async () => {
    const user = await strategy.validate(req('GET'), {
      ...payload,
      impersonadoPor: 'u-super',
    });
    expect(user.impersonadoPor).toBe('u-super');
  });

  it.each(['POST', 'PATCH', 'PUT', 'DELETE'])(
    'blocks %s in a Ver como session (solo lectura)',
    async (method) => {
      await expect(
        strategy.validate(req(method), {
          ...payload,
          impersonadoPor: 'u-super',
        }),
      ).rejects.toThrow(ForbiddenException);
    },
  );

  it('a normal session can write', async () => {
    const user = await strategy.validate(req('POST'), payload);
    expect(user.impersonadoPor).toBeUndefined();
  });

  describe('sesiones revocadas', () => {
    it('rechaza un token emitido antes de la revocación', async () => {
      revokedAt.mockResolvedValue(2_000);
      await expect(strategy.validate(req('GET'), payload)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('acepta un token emitido después (o en el mismo segundo) de la revocación', async () => {
      revokedAt.mockResolvedValue(1_000);
      await expect(
        strategy.validate(req('GET'), payload),
      ).resolves.toMatchObject({ id: 'u1' });
    });
  });

  describe('contraseña temporal sin cambiar (mcp)', () => {
    const conMcp = { ...payload, mcp: true };

    it.each([
      ['GET', '/auth/me'],
      ['POST', '/auth/logout'],
      ['POST', '/auth/change-password'],
    ])('permite %s %s', async (method, path) => {
      await expect(
        strategy.validate(req(method, path), conMcp),
      ).resolves.toMatchObject({ id: 'u1' });
    });

    it.each([
      ['GET', '/coachees/me'],
      ['POST', '/sesiones'],
      ['GET', '/auth/me/otra-cosa'],
    ])('bloquea %s %s', async (method, path) => {
      await expect(
        strategy.validate(req(method, path), conMcp),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
