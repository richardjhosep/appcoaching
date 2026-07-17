import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { Role } from '../enums/role.enum';

describe('RolesGuard', () => {
  const buildContext = (role: Role): ExecutionContext =>
    ({
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ user: { id: 'u1', email: 'a@b.com', role } }),
      }),
    }) as unknown as ExecutionContext;

  it('allows the request when no roles are required', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(undefined),
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);

    expect(guard.canActivate(buildContext(Role.COACHEE))).toBe(true);
  });

  it('allows the request when the user has one of the required roles', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue([Role.COACH]),
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);

    expect(guard.canActivate(buildContext(Role.COACH))).toBe(true);
  });

  it('rejects the request when the user does not have a required role', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue([Role.COACH]),
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);

    expect(guard.canActivate(buildContext(Role.COACHEE))).toBe(false);
  });
});
