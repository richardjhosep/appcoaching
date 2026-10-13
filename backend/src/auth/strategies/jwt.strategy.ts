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

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('jwt.accessSecret')!,
      passReqToCallback: true,
    });
  }

  validate(req: Request, payload: AccessTokenPayload): AuthenticatedUser {
    if (!payload.sub || !payload.role) {
      throw new UnauthorizedException('Sesión inválida o expirada.');
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
