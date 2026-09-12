import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { Role } from './enums/role.enum';
import { UsersService } from '../users/users.service';
import { RedisService } from '../redis/redis.service';
import { AuditService } from '../audit/audit.service';
import { CoacheesService } from '../coachees/coachees.service';
import { EmailService } from '../email/email.service';

describe('AuthService', () => {
  let service: AuthService;
  let jwt: { sign: jest.Mock; verify: jest.Mock };
  let users: {
    findByEmail: jest.Mock;
    findById: jest.Mock;
    setNewPassword: jest.Mock;
  };
  let redis: { setWithTtl: jest.Mock; get: jest.Mock; delete: jest.Mock };
  let audit: { record: jest.Mock };
  let config: { get: jest.Mock };
  let coachees: { findByUserId: jest.Mock };
  let email: { sendPasswordReset: jest.Mock };

  const CONFIG_VALUES: Record<string, string> = {
    'jwt.accessSecret': 'access-secret',
    'jwt.accessTtl': '15m',
    'jwt.refreshSecret': 'refresh-secret',
    'jwt.refreshTtl': '7d',
    frontendUrl: 'https://app.example.com',
  };

  beforeEach(() => {
    jwt = {
      sign: jest.fn().mockReturnValue('signed-token'),
      verify: jest.fn(),
    };
    users = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      setNewPassword: jest.fn(),
    };
    redis = { setWithTtl: jest.fn(), get: jest.fn(), delete: jest.fn() };
    audit = { record: jest.fn() };
    config = { get: jest.fn((key: string) => CONFIG_VALUES[key]) };
    coachees = { findByUserId: jest.fn() };
    email = { sendPasswordReset: jest.fn() };

    service = new AuthService(
      jwt as unknown as JwtService,
      config as unknown as ConfigService,
      users as unknown as UsersService,
      redis as unknown as RedisService,
      audit as unknown as AuditService,
      coachees as unknown as CoacheesService,
      email as unknown as EmailService,
    );
  });

  const buildUser = async (password: string) => ({
    id: 'user-1',
    email: 'coach@example.com',
    passwordHash: await bcrypt.hash(password, 4),
    role: Role.COACH,
    isActive: true,
  });

  describe('login', () => {
    it('returns a token pair and records LOGIN_SUCCESS on valid credentials', async () => {
      const user = await buildUser('correct-password');
      users.findByEmail.mockResolvedValue(user);

      const result = await service.login(
        'coach@example.com',
        'correct-password',
      );

      expect(result).toEqual({
        accessToken: 'signed-token',
        refreshToken: 'signed-token',
      });
      expect(redis.setWithTtl).toHaveBeenCalledTimes(1);
      expect(audit.record).toHaveBeenCalledWith('LOGIN_SUCCESS', {
        userId: 'user-1',
      });
    });

    it('rejects and records LOGIN_FAILED on wrong password', async () => {
      const user = await buildUser('correct-password');
      users.findByEmail.mockResolvedValue(user);

      await expect(
        service.login('coach@example.com', 'wrong-password'),
      ).rejects.toThrow(UnauthorizedException);
      expect(audit.record).toHaveBeenCalledWith('LOGIN_FAILED', {
        metadata: { email: 'coach@example.com' },
      });
    });

    it('rejects when no user exists for the email', async () => {
      users.findByEmail.mockResolvedValue(null);

      await expect(
        service.login('nobody@example.com', 'whatever'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('rejects when the user is inactive', async () => {
      const user = await buildUser('correct-password');
      users.findByEmail.mockResolvedValue({ ...user, isActive: false });

      await expect(
        service.login('coach@example.com', 'correct-password'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('rejects when the temporary password has expired', async () => {
      const user = await buildUser('correct-password');
      users.findByEmail.mockResolvedValue({
        ...user,
        mustChangePassword: true,
        tempPasswordExpiresAt: new Date(Date.now() - 1000),
      });

      await expect(
        service.login('coach@example.com', 'correct-password'),
      ).rejects.toThrow(UnauthorizedException);
      expect(audit.record).toHaveBeenCalledWith('LOGIN_FAILED', {
        userId: 'user-1',
        metadata: { reason: 'temp_password_expired' },
      });
    });

    it('allows login when the temporary password has not expired yet', async () => {
      const user = await buildUser('correct-password');
      users.findByEmail.mockResolvedValue({
        ...user,
        mustChangePassword: true,
        tempPasswordExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
      });

      const result = await service.login(
        'coach@example.com',
        'correct-password',
      );

      expect(result).toEqual({
        accessToken: 'signed-token',
        refreshToken: 'signed-token',
      });
    });
  });

  describe('refresh', () => {
    it('rotates the refresh token: deletes the old jti and issues a new pair', async () => {
      jwt.verify.mockReturnValue({ sub: 'user-1', jti: 'jti-1' });
      redis.get.mockResolvedValue('1');
      users.findById.mockResolvedValue({
        id: 'user-1',
        email: 'coach@example.com',
        role: Role.COACH,
        isActive: true,
      });

      const result = await service.refresh('some-refresh-token');

      expect(redis.get).toHaveBeenCalledWith('refresh:user-1:jti-1');
      expect(redis.delete).toHaveBeenCalledWith('refresh:user-1:jti-1');
      expect(result).toEqual({
        accessToken: 'signed-token',
        refreshToken: 'signed-token',
      });
    });

    it('rejects when the refresh token was already revoked/used', async () => {
      jwt.verify.mockReturnValue({ sub: 'user-1', jti: 'jti-1' });
      redis.get.mockResolvedValue(null);

      await expect(service.refresh('some-refresh-token')).rejects.toThrow(
        UnauthorizedException,
      );
      expect(redis.delete).not.toHaveBeenCalled();
    });

    it('rejects an invalid/expired refresh token signature', async () => {
      jwt.verify.mockImplementation(() => {
        throw new Error('jwt expired');
      });

      await expect(service.refresh('bad-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('deletes the refresh token key and records LOGOUT', async () => {
      jwt.verify.mockReturnValue({ sub: 'user-1', jti: 'jti-1' });

      await service.logout('user-1', 'some-refresh-token');

      expect(redis.delete).toHaveBeenCalledWith('refresh:user-1:jti-1');
      expect(audit.record).toHaveBeenCalledWith('LOGOUT', { userId: 'user-1' });
    });

    it('still records LOGOUT even if the refresh token is already invalid', async () => {
      jwt.verify.mockImplementation(() => {
        throw new Error('jwt expired');
      });

      await service.logout('user-1', 'bad-token');

      expect(redis.delete).not.toHaveBeenCalled();
      expect(audit.record).toHaveBeenCalledWith('LOGOUT', { userId: 'user-1' });
    });
  });

  describe('getProfile', () => {
    it('includes the linked coachee name for a coachee account', async () => {
      coachees.findByUserId.mockResolvedValue({ nombre: 'Ignacio Prieto' });

      const profile = await service.getProfile({
        id: 'user-1',
        email: 'ignacio@example.com',
        role: Role.COACHEE,
        empresaId: null,
      });

      expect(profile.nombre).toBe('Ignacio Prieto');
    });

    it('returns null nombre for a coach account (no name field yet)', async () => {
      const profile = await service.getProfile({
        id: 'user-1',
        email: 'coach@example.com',
        role: Role.COACH,
        empresaId: null,
      });

      expect(profile.nombre).toBeNull();
      expect(coachees.findByUserId).not.toHaveBeenCalled();
    });

    it('returns null nombre when the coachee has no linked profile', async () => {
      coachees.findByUserId.mockResolvedValue(null);

      const profile = await service.getProfile({
        id: 'user-1',
        email: 'orphan@example.com',
        role: Role.COACHEE,
        empresaId: null,
      });

      expect(profile.nombre).toBeNull();
    });

    it('includes mustChangePassword from the underlying user record', async () => {
      users.findById.mockResolvedValue({ mustChangePassword: true });

      const profile = await service.getProfile({
        id: 'user-1',
        email: 'coach@example.com',
        role: Role.COACH,
        empresaId: null,
      });

      expect(profile.mustChangePassword).toBe(true);
    });
  });

  describe('requestPasswordReset', () => {
    it('emails a reset link and records the request when the account exists and is active', async () => {
      users.findByEmail.mockResolvedValue({
        id: 'user-1',
        email: 'coach@example.com',
        role: Role.COACH,
        isActive: true,
      });
      redis.get.mockResolvedValue(null);

      const result = await service.requestPasswordReset('coach@example.com');

      expect(result).toEqual({ success: true });
      expect(redis.setWithTtl).toHaveBeenCalledTimes(2);
      expect(email.sendPasswordReset).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'coach@example.com' }),
      );
      const { resetUrl } = email.sendPasswordReset.mock.calls[0][0] as {
        resetUrl: string;
      };
      expect(resetUrl).toMatch(
        /^https:\/\/app\.example\.com\/restablecer-contrasena\/[0-9a-f]{64}$/,
      );
      expect(audit.record).toHaveBeenCalledWith('PASSWORD_RESET_REQUESTED', {
        userId: 'user-1',
      });
    });

    it('invalidates a previously issued token before creating a new one', async () => {
      users.findByEmail.mockResolvedValue({
        id: 'user-1',
        email: 'coach@example.com',
        role: Role.COACH,
        isActive: true,
      });
      redis.get.mockResolvedValue('old-token');

      await service.requestPasswordReset('coach@example.com');

      expect(redis.delete).toHaveBeenCalledWith('pwreset:token:old-token');
    });

    it('responds with success without sending an email when no account matches — avoids leaking which emails are registered', async () => {
      users.findByEmail.mockResolvedValue(null);

      const result = await service.requestPasswordReset('nobody@example.com');

      expect(result).toEqual({ success: true });
      expect(email.sendPasswordReset).not.toHaveBeenCalled();
      expect(audit.record).not.toHaveBeenCalled();
    });

    it('responds with success without sending an email when the account is inactive', async () => {
      users.findByEmail.mockResolvedValue({
        id: 'user-1',
        email: 'coach@example.com',
        role: Role.COACH,
        isActive: false,
      });

      await service.requestPasswordReset('coach@example.com');

      expect(email.sendPasswordReset).not.toHaveBeenCalled();
    });
  });

  describe('resetPasswordWithToken', () => {
    it('sets the new password and consumes the token on a valid request', async () => {
      redis.get.mockResolvedValue('user-1');

      const result = await service.resetPasswordWithToken(
        'a-valid-token',
        'NuevaClave#2026Segura',
      );

      expect(result).toEqual({ success: true });
      expect(users.setNewPassword).toHaveBeenCalledWith(
        'user-1',
        'NuevaClave#2026Segura',
      );
      expect(redis.delete).toHaveBeenCalledWith('pwreset:token:a-valid-token');
      expect(redis.delete).toHaveBeenCalledWith('pwreset:user:user-1');
      expect(audit.record).toHaveBeenCalledWith('PASSWORD_RESET_VIA_TOKEN', {
        userId: 'user-1',
      });
    });

    it('rejects an unknown or already-used token', async () => {
      redis.get.mockResolvedValue(null);

      await expect(
        service.resetPasswordWithToken('bad-token', 'NuevaClave#2026Segura'),
      ).rejects.toThrow(UnauthorizedException);
      expect(users.setNewPassword).not.toHaveBeenCalled();
    });
  });
});
