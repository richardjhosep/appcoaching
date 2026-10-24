import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AccessTokenPayload, AuthenticatedUser } from '../auth.types';
import { SessionRevocationService } from '../../redis/session-revocation.service';

// Con una contraseña temporal sin cambiar solo se puede cambiarla, cerrar sesión o ver el perfil.
const PERMITIDOS_CON_PASSWORD_TEMPORAL = new Set([
  'GET /auth/me',
  'POST /auth/logout',
  'POST /auth/change-password',
]);

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private readonly sessions: SessionRevocationService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('jwt.accessSecret')!,
      passReqToCallback: true,
    });
  }

  async validate(
    req: Request,
    payload: AccessTokenPayload,
  ): Promise<AuthenticatedUser> {
    if (!payload.sub || !payload.role) {
      throw new UnauthorizedException('Sesión inválida o expirada.');
    }
    // Sesión cerrada a la fuerza (cambio/reseteo de contraseña, cuenta desactivada o eliminada).
    const revocadoDesde = await this.sessions.revokedAt(payload.sub);
    if (revocadoDesde !== null && (payload.iat ?? 0) < revocadoDesde) {
      throw new UnauthorizedException('Sesión inválida o expirada.');
    }
    if (
      payload.mcp &&
      !PERMITIDOS_CON_PASSWORD_TEMPORAL.has(`${req.method} ${req.path}`)
    ) {
      throw new ForbiddenException(
        'Debes cambiar tu contraseña temporal antes de continuar.',
      );
    }
    // "Ver como" es solo para mirar: un único punto de control para todos los endpoints
    // autenticados (todos pasan por esta estrategia), en vez de repetirlo controller por
    // controller.
    if (payload.impersonadoPor && req.method !== 'GET') {
      throw new ForbiddenException(
        'Estás en modo "Ver como" (solo lectura): no se pueden hacer cambios.',
      );
    }
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      empresaId: payload.empresaId,
      ...(payload.impersonadoPor
        ? { impersonadoPor: payload.impersonadoPor }
        : {}),
    };
  }
}
