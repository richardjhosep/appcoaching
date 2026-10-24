import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { randomBytes, randomUUID } from 'crypto';
import { UsersService } from '../users/users.service';
import { AuditService } from '../audit/audit.service';
import { RedisService } from '../redis/redis.service';
import { CoacheesService } from '../coachees/coachees.service';
import { EmailService } from '../email/email.service';
import { durationToSeconds } from '../common/duration.util';
import { User } from '../users/entities/user.entity';
import { Role } from './enums/role.enum';
import {
  AccessTokenPayload,
  AuthenticatedUser,
  RefreshTokenPayload,
} from './auth.types';

const PASSWORD_RESET_TTL_SECONDS = 60 * 60;

// Bloqueo por cuenta (además del límite por IP del controller): tras tantos intentos fallidos
// seguidos contra un mismo correo, se rechazan los siguientes durante la ventana. Un atacante
// con muchas IPs ya no puede probar contraseñas sin tope contra una sola cuenta.
const MAX_INTENTOS_FALLIDOS = 10;
const VENTANA_BLOQUEO_SEGUNDOS = 15 * 60;
// Hash de una contraseña inexistente: se compara cuando el correo no existe, para que la
// respuesta tarde lo mismo y no revele qué correos están registrados.
const HASH_FICTICIO =
  '$2b$12$OfNcUN2z68a.u9mxmn7EwuqSMCCObTh/zxrjQgSymnd34FbVXWACi';

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
    private readonly email: EmailService,
  ) {}

  /**
   * Coachee accounts borrow their display name from the linked Coachee
   * profile (the only place a "nombre" is captured today); coach/empresa
   * accounts have no name field yet, so they fall back to null.
   */
  esSuperadmin(email: string): boolean {
    return (this.config.get<string[]>('superadminEmails') ?? []).includes(
      email.toLowerCase(),
    );
  }

  /**
   * "Ver como": token de acceso del coachee/empresa elegido, marcado con quién lo pidió.
   * Corto (30 min) y sin refresh token — al vencer, el frontend vuelve a la sesión propia.
   * Solo lectura: lo hace cumplir JwtStrategy.
   */
  async verComo(
    actor: AuthenticatedUser,
    targetUserId: string,
  ): Promise<{ accessToken: string }> {
    if (actor.impersonadoPor || !this.esSuperadmin(actor.email)) {
      throw new ForbiddenException('No tienes acceso a "Ver como".');
    }
    const target = await this.users.findById(targetUserId);
    if (!target) {
      throw new NotFoundException('Usuario no encontrado.');
    }
    if (target.role === Role.COACH) {
      throw new BadRequestException(
        '"Ver como" es solo para cuentas de coachee o empresa.',
      );
    }
    const payload: AccessTokenPayload = {
      sub: target.id,
      email: target.email,
      role: target.role,
      empresaId: target.empresaId,
      impersonadoPor: actor.id,
    };
    const accessToken = this.jwt.sign(payload, {
      secret: this.config.get<string>('jwt.accessSecret'),
      expiresIn: 30 * 60,
    });
    await this.audit.record('VER_COMO_INICIADO', {
      userId: actor.id,
      targetType: 'User',
      targetId: target.id,
      targetLabel: target.email,
    });
    return { accessToken };
  }

  async getProfile(authUser: AuthenticatedUser): Promise<
    AuthenticatedUser & {
      nombre: string | null;
      mustChangePassword: boolean;
      superadmin: boolean;
    }
  > {
    let nombre: string | null = null;
    if (authUser.role === Role.COACHEE) {
      const coachee = await this.coachees.findByUserId(authUser.id);
      nombre = coachee?.nombre ?? null;
    }
    const user = await this.users.findById(authUser.id);
    return {
      ...authUser,
      nombre,
      // En una sesión "Ver como" nunca se cambia la contraseña del usuario mirado.
      mustChangePassword: authUser.impersonadoPor
        ? false
        : (user?.mustChangePassword ?? false),
      superadmin: !authUser.impersonadoPor && this.esSuperadmin(authUser.email),
    };
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
      ...(user.mustChangePassword ? { mcp: true } : {}),
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

  private intentosFallidosKey(email: string): string {
    return `login:fail:${email.trim().toLowerCase()}`;
  }

  async login(email: string, password: string): Promise<TokenPair> {
    const intentosKey = this.intentosFallidosKey(email);
    const intentos = Number((await this.redis.get(intentosKey)) ?? 0);
    if (intentos >= MAX_INTENTOS_FALLIDOS) {
      throw new HttpException(
        'Demasiados intentos fallidos. Espera unos minutos antes de volver a intentarlo.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const user = await this.users.findByEmail(email);
    const valid = await bcrypt.compare(
      password,
      user ? user.passwordHash : HASH_FICTICIO,
    );

    if (!user || !user.isActive || !valid) {
      await this.redis.incrWithTtl(intentosKey, VENTANA_BLOQUEO_SEGUNDOS);
      await this.audit.record('LOGIN_FAILED', { metadata: { email } });
      throw new UnauthorizedException('Credenciales inválidas.');
    }
    await this.redis.delete(intentosKey);

    if (
      user.mustChangePassword &&
      user.tempPasswordExpiresAt &&
      user.tempPasswordExpiresAt.getTime() < Date.now()
    ) {
      await this.audit.record('LOGIN_FAILED', {
        userId: user.id,
        metadata: { reason: 'temp_password_expired' },
      });
      throw new UnauthorizedException(
        'Tu contraseña temporal expiró. Pide a tu coach que te la restablezca.',
      );
    }

    const tokens = await this.issueTokens(user);
    await this.audit.record('LOGIN_SUCCESS', { userId: user.id });
    return tokens;
  }

  /**
   * Cambia la contraseña del propio usuario. Como eso cierra todas sus sesiones (incluida esta),
   * devuelve un par de tokens nuevo para que el dispositivo desde el que cambió siga adentro.
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<TokenPair> {
    await this.users.changePassword(userId, currentPassword, newPassword);
    const user = await this.users.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Sesión inválida o expirada.');
    }
    return this.issueTokens(user);
  }

  async refresh(refreshToken: string): Promise<TokenPair> {
    let payload: RefreshTokenPayload;
    try {
      payload = this.jwt.verify<RefreshTokenPayload>(refreshToken, {
        secret: this.config.get<string>('jwt.refreshSecret'),
      });
    } catch {
      throw new UnauthorizedException('Token de actualización inválido.');
    }

    const key = this.refreshKey(payload.sub, payload.jti);
    const stillValid = await this.redis.get(key);
    if (!stillValid) {
      throw new UnauthorizedException(
        'El token de actualización fue revocado o expiró.',
      );
    }
    await this.redis.delete(key);

    const user = await this.users.findById(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Token de actualización inválido.');
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

  private passwordResetTokenKey(token: string): string {
    return `pwreset:token:${token}`;
  }

  private passwordResetUserKey(userId: string): string {
    return `pwreset:user:${userId}`;
  }

  /**
   * Siempre responde con éxito exista o no la cuenta — de lo contrario el
   * formulario de "olvidé mi contraseña" se podría usar para averiguar qué
   * correos están registrados. Solo un correo activo recibe el enlace.
   */
  async requestPasswordReset(email: string): Promise<{ success: true }> {
    const user = await this.users.findByEmail(email);
    if (user && user.isActive) {
      // Un pedido nuevo invalida cualquier enlace anterior todavía vigente —
      // solo un enlace activo por persona a la vez.
      const previousToken = await this.redis.get(
        this.passwordResetUserKey(user.id),
      );
      if (previousToken) {
        await this.redis.delete(this.passwordResetTokenKey(previousToken));
      }

      const token = randomBytes(32).toString('hex');
      await Promise.all([
        this.redis.setWithTtl(
          this.passwordResetTokenKey(token),
          user.id,
          PASSWORD_RESET_TTL_SECONDS,
        ),
        this.redis.setWithTtl(
          this.passwordResetUserKey(user.id),
          token,
          PASSWORD_RESET_TTL_SECONDS,
        ),
      ]);

      let nombre: string | null = null;
      if (user.role === Role.COACHEE) {
        const coachee = await this.coachees.findByUserId(user.id);
        nombre = coachee?.nombre ?? null;
      }

      const resetUrl = `${this.config.get<string>('frontendUrl')}/restablecer-contrasena/${token}`;
      void this.email.sendPasswordReset({ to: user.email, nombre, resetUrl });
      await this.audit.record('PASSWORD_RESET_REQUESTED', {
        userId: user.id,
      });
    }
    return { success: true };
  }

  async resetPasswordWithToken(
    token: string,
    newPassword: string,
  ): Promise<{ success: true }> {
    const userId = await this.redis.get(this.passwordResetTokenKey(token));
    if (!userId) {
      throw new UnauthorizedException('El enlace no es válido o ya expiró.');
    }

    await this.users.setNewPassword(userId, newPassword);
    await Promise.all([
      this.redis.delete(this.passwordResetTokenKey(token)),
      this.redis.delete(this.passwordResetUserKey(userId)),
    ]);
    await this.audit.record('PASSWORD_RESET_VIA_TOKEN', { userId });
    return { success: true };
  }
}
