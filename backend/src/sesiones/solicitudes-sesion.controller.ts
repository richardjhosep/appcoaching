import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { SolicitudesSesionService } from './solicitudes-sesion.service';
import { CreateSolicitudSesionDto } from './dto/create-solicitud-sesion.dto';
import { ResponderSolicitudSesionDto } from './dto/responder-solicitud-sesion.dto';
import { ContraproponerSolicitudSesionDto } from './dto/contraproponer-solicitud-sesion.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '../auth/enums/role.enum';
import type { AuthenticatedUser } from '../auth/auth.types';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('solicitudes-sesion')
export class SolicitudesSesionController {
  constructor(private readonly solicitudes: SolicitudesSesionService) {}

  @Roles(Role.COACHEE)
  @Post()
  crear(
    @Body() dto: CreateSolicitudSesionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.solicitudes.crear(actor.id, dto.fechaHoraPropuesta, dto.motivo);
  }

  @Roles(Role.COACHEE)
  @Get('mias')
  findMine(@CurrentUser() actor: AuthenticatedUser) {
    return this.solicitudes.findAbiertasDelCoachee(actor.id);
  }

  @Roles(Role.COACHEE)
  @Post(':id/aceptar-contrapropuesta')
  aceptarContrapropuesta(
    @Param('id') id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.solicitudes.resolverContrapropuesta(id, actor.id, true);
  }

  @Roles(Role.COACHEE)
  @Post(':id/rechazar-contrapropuesta')
  rechazarContrapropuesta(
    @Param('id') id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.solicitudes.resolverContrapropuesta(id, actor.id, false);
  }

  @Roles(Role.COACH)
  @Post(':id/contraproponer')
  contraproponer(
    @Param('id') id: string,
    @Body() dto: ContraproponerSolicitudSesionDto,
  ) {
    return this.solicitudes.contraproponer(id, dto);
  }

  @Roles(Role.COACH)
  @Get()
  findAllPending() {
    return this.solicitudes.findAllPending();
  }

  @Roles(Role.COACH)
  @Post(':id/responder')
  responder(@Param('id') id: string, @Body() dto: ResponderSolicitudSesionDto) {
    return this.solicitudes.responder(id, dto);
  }
}
