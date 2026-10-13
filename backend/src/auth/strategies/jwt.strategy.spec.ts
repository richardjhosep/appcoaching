import { ForbiddenException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { JwtStrategy } from './jwt.strategy';
import { Role } from '../enums/role.enum';

describe('JwtStrategy', () => {
  const strategy = new JwtStrategy({
    get: () => 'access-secret',
  } as unknown as ConfigService);
  const payload = {
    sub: 'u1',
    email: 'a@x.cl',
    role: Role.COACHEE,
    empresaId: null,
  };

  it('lets a Ver como session read (GET) and exposes who is watching', () => {
    const user = strategy.validate({ method: 'GET' } as Request, {
      ...payload,
      impersonadoPor: 'u-super',
    });
    expect(user.impersonadoPor).toBe('u-super');
  });

  it.each(['POST', 'PATCH', 'PUT', 'DELETE'])(
    'blocks %s in a Ver como session (solo lectura)',
    (method) => {
      expect(() =>
        strategy.validate({ method } as Request, {
          ...payload,
          impersonadoPor: 'u-super',
        }),
      ).toThrow(ForbiddenException);
    },
  );

  it('a normal session can write', () => {
    expect(
      strategy.validate({ method: 'POST' } as Request, payload).impersonadoPor,
    ).toBeUndefined();
  });
});
