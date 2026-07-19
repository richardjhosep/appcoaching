import { Controller, Get, UseGuards } from '@nestjs/common';
import { NegocioService } from './negocio.service';
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
  @Get('alertas')
  alertas() {
    return this.negocio.alertasSeguimiento();
  }

  @Roles(Role.COACH)
  @Get('avance-por-area')
  avancePorArea() {
    return this.negocio.avancePorArea();
  }
}
