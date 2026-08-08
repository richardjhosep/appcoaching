import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { NegocioService, type PeriodoComercial } from './negocio.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('negocio')
export class NegocioController {
  constructor(private readonly negocio: NegocioService) {}

  @Roles(Role.COACH)
  @Get('resumen')
  resumen() {
    return this.negocio.resumenNegocio();
  }

  @Roles(Role.COACH)
  @Get('comercial')
  comercial(@Query('periodo') periodo: PeriodoComercial = 'mes') {
    return this.negocio.resumenComercial(periodo);
  }

  @Roles(Role.COACH)
  @Get('proyeccion-mensual')
  proyeccionMensual() {
    return this.negocio.proyeccionMensual();
  }

  @Roles(Role.COACH)
  @Get('alertas')
  alertas() {
    return this.negocio.alertasSeguimiento();
  }

  @Roles(Role.COACH)
  @Get('avance-por-area')
  avancePorArea() {
    return this.negocio.avancePorArea();
  }

  @Roles(Role.COACH)
  @Post('coachees/:coacheeId/recordatorio-sesion')
  async recordatorioSesion(@Param('coacheeId') coacheeId: string) {
    await this.negocio.enviarRecordatorioSesion(coacheeId);
    return { success: true };
  }

  @Roles(Role.COACH)
  @Post('coachees/:coacheeId/recordatorio-logro')
  async recordatorioLogro(@Param('coacheeId') coacheeId: string) {
    await this.negocio.enviarRecordatorioLogro(coacheeId);
    return { success: true };
  }
}
