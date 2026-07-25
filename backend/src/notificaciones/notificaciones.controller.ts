import { Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { NotificacionesService } from './notificaciones.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notificaciones')
export class NotificacionesController {
  constructor(private readonly notificaciones: NotificacionesService) {}

  @Get('me')
  listMine(@CurrentUser() actor: AuthenticatedUser) {
    return this.notificaciones.listarPropias(actor.id);
  }

  @Get('me/no-leidas')
  async contarMine(@CurrentUser() actor: AuthenticatedUser) {
    return { count: await this.notificaciones.contarNoLeidas(actor.id) };
  }

  @Patch(':id/leida')
  marcarLeida(
    @Param('id') id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.notificaciones.marcarLeida(id, actor.id);
  }
}
