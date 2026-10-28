import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { PrivacidadService } from './privacidad.service';
import { SuprimirCoacheeDto } from './dto/suprimir-coachee.dto';
import { AuditService } from '../audit/audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '../auth/enums/role.enum';
import type { AuthenticatedUser } from '../auth/auth.types';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('privacidad')
export class PrivacidadController {
  constructor(
    private readonly privacidad: PrivacidadService,
    private readonly audit: AuditService,
  ) {}

  /** El coachee descarga todo lo que la plataforma guarda de él. */
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Roles(Role.COACHEE)
  @Get('mis-datos')
  async misDatos(@CurrentUser() actor: AuthenticatedUser) {
    const coachee = await this.privacidad.coacheeDeUsuario(actor.id);
    await this.audit.record('DATOS_EXPORTADOS', {
      userId: actor.id,
      targetType: 'Coachee',
      targetId: coachee.id,
      metadata: { via: 'titular' },
    });
    return this.privacidad.exportar(coachee.id);
  }

  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @Roles(Role.COACHEE)
  @HttpCode(HttpStatus.OK)
  @Post('solicitar-supresion')
  async solicitarSupresion(@CurrentUser() actor: AuthenticatedUser) {
    const coachee = await this.privacidad.coacheeDeUsuario(actor.id);
    await this.privacidad.solicitarSupresion(actor.id);
    await this.audit.record('SUPRESION_SOLICITADA', {
      userId: actor.id,
      targetType: 'Coachee',
      targetId: coachee.id,
    });
    return { success: true };
  }

  /** El coach exporta los datos de un coachee que se lo pidió. */
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Roles(Role.COACH)
  @Get('coachees/:id/exportar')
  async exportar(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    const exportacion = await this.privacidad.exportar(id);
    await this.audit.record('DATOS_EXPORTADOS', {
      userId: actor.id,
      targetType: 'Coachee',
      targetId: id,
      metadata: { via: 'coach' },
    });
    return exportacion;
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Roles(Role.COACH)
  @Delete('coachees/:id')
  async suprimir(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SuprimirCoacheeDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    const archivosBorrados = await this.privacidad.suprimir(
      id,
      dto.confirmarNombre,
    );
    // Sin nombre en la auditoría: el registro de la supresión no puede conservar el dato suprimido.
    await this.audit.record('COACHEE_SUPRIMIDO', {
      userId: actor.id,
      targetType: 'Coachee',
      targetId: id,
      targetLabel: 'Coachee suprimido (Ley 21.719)',
      metadata: { archivosBorrados },
    });
    return { success: true, archivosBorrados };
  }
}
