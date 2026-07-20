import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { UsersService } from '../users/users.service';
import { AuditService } from '../audit/audit.service';
import { RedisService } from '../redis/redis.service';
import { CoacheesService } from '../coachees/coachees.service';
import { durationToSeconds } from '../common/duration.util';
import { User } from '../users/entities/user.entity';
import { Role } from './enums/role.enum';
import {
  AccessTokenPayload,
  AuthenticatedUser,
  RefreshTokenPayload,
} from './auth.types';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly users: UsersService,
    private readonly redis: RedisService,
    private readonly audit: AuditService,
    private readonly coachees: CoacheesService,
  ) {}

  /**
   * Coachee accounts borrow their display name from the linked Coachee
   * profile (the only place a "nombre" is captured today); coach/empresa
   * accounts have no name field yet, so they fall back to null.
   */
  async getProfile(
    authUser: AuthenticatedUser,
  ): Promise<AuthenticatedUser & { nombre: string | null }> {
    let nombre: string | null = null;
    if (authUser.role === Role.COACHEE) {
      const coachee = await this.coachees.findByUserId(authUser.id);
      nombre = coachee?.nombre ?? null;
    }
    return { ...authUser, nombre };
  }

  private refreshKey(userId: string, jti: string): string {
    return `refresh:${userId}:${jti}`;
  }

  private async issueTokens(user: User): Promise<TokenPair> {
    const accessTtlSeconds = durationToSeconds(
      this.config.get<string>('jwt.accessTtl')!,
    );
    const accessPayload: AccessTokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      empresaId: user.empresaId,
    };
    const accessToken = this.jwt.sign(accessPayload, {
      secret: this.config.get<string>('jwt.accessSecret'),
      expiresIn: accessTtlSeconds,
    });

    const jti = randomUUID();
    const refreshTtlSeconds = durationToSeconds(
      this.config.get<string>('jwt.refreshTtl')!,
    );
    const refreshPayload: RefreshTokenPayload = { sub: user.id, jti };
    const refreshToken = this.jwt.sign(refreshPayload, {
      secret: this.config.get<string>('jwt.refreshSecret'),
      expiresIn: refreshTtlSeconds,
    });

    await this.redis.setWithTtl(
      this.refreshKey(user.id, jti),
      '1',
      refreshTtlSeconds,
    );

    return { accessToken, refreshToken };
  }

  async login(email: string, password: string): Promise<TokenPair> {
    const user = await this.users.findByEmail(email);
    const valid = user
      ? await bcrypt.compare(password, user.passwordHash)
      : false;

    if (!user || !user.isActive || !valid) {
      await this.audit.record('LOGIN_FAILED', { metadata: { email } });
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.issueTokens(user);
    await this.audit.record('LOGIN_SUCCESS', { userId: user.id });
    return tokens;
  }

  async refresh(refreshToken: string): Promise<TokenPair> {
    let payload: RefreshTokenPayload;
    try {
      payload = this.jwt.verify<RefreshTokenPayload>(refreshToken, {
        secret: this.config.get<string>('jwt.refreshSecret'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const key = this.refreshKey(payload.sub, payload.jti);
    const stillValid = await this.redis.get(key);
    if (!stillValid) {
      throw new UnauthorizedException('Refresh token revoked or expired');
    }
    await this.redis.delete(key);

    const user = await this.users.findById(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    return this.issueTokens(user);
  }

  async logout(userId: string, refreshToken: string): Promise<void> {
    try {
      const payload = this.jwt.verify<RefreshTokenPayload>(refreshToken, {
        secret: this.config.get<string>('jwt.refreshSecret'),
      });
      await this.redis.delete(this.refreshKey(payload.sub, payload.jti));
    } catch {
      // Token already invalid/expired: nothing to revoke.
    }
    await this.audit.record('LOGOUT', { userId });
  }
}
