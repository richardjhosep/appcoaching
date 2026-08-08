import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CoacheesService } from './coachees.service';
import { AuditService } from '../audit/audit.service';

/**
 * Endpoints públicos (sin JWT) para que el propio coachee confirme su
 * consentimiento informado desde el link que le llega por correo — mismo
 * estilo sin-guards que AuthController.login/refresh. El @Throttle es defensa
 * adicional: el token ya es un secreto de 32 bytes, imposible de adivinar.
 */
@Controller('consentimiento')
export class ConsentimientoController {
  constructor(
    private readonly coachees: CoacheesService,
    private readonly audit: AuditService,
  ) {}

  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Get(':token')
  async obtener(@Param('token') token: string) {
    const { solicitud, coachee } =
      await this.coachees.obtenerSolicitudPorToken(token);
    return {
      nombre: coachee.nombre,
      estado: solicitud.estado,
      expirada: solicitud.expiraEn.getTime() < Date.now(),
    };
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @Post(':token/aceptar')
  async aceptar(@Param('token') token: string) {
    const coachee = await this.coachees.responderSolicitud(token, true);
    await this.audit.record('CONSENTIMIENTO_ACTUALIZADO', {
      userId: coachee.userId,
      targetType: 'Coachee',
      targetId: coachee.id,
      metadata: { informado: true, via: 'email' },
    });
    return { success: true };
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @Post(':token/rechazar')
  async rechazar(@Param('token') token: string) {
    const coachee = await this.coachees.responderSolicitud(token, false);
    await this.audit.record('CONSENTIMIENTO_ACTUALIZADO', {
      userId: coachee.userId,
      targetType: 'Coachee',
      targetId: coachee.id,
      metadata: { informado: false, via: 'email' },
    });
    return { success: true };
  }
}
