import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SatisfaccionService } from './satisfaccion.service';
import { CreateEncuestaDto } from './dto/create-encuesta.dto';
import { CreateSolicitudProcesoDto } from './dto/create-solicitud-proceso.dto';
import { EstadoSolicitudProceso } from './enums/estado-solicitud-proceso.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '../auth/enums/role.enum';
import type { AuthenticatedUser } from '../auth/auth.types';

function resolveOwnEmpresaId(actor: AuthenticatedUser): string {
  if (!actor.empresaId) {
    throw new ForbiddenException('Esta cuenta no está asociada a una empresa.');
  }
  return actor.empresaId;
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('satisfaccion')
export class SatisfaccionController {
  constructor(private readonly satisfaccion: SatisfaccionService) {}

  @Roles(Role.EMPRESA)
  @Post('encuestas')
  crearEncuesta(
    @Body() dto: CreateEncuestaDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.satisfaccion.crearEncuesta(resolveOwnEmpresaId(actor), dto);
  }

  @Roles(Role.EMPRESA)
  @Get('encuestas/me')
  misEncuestas(@CurrentUser() actor: AuthenticatedUser) {
    return this.satisfaccion.listarEncuestas(resolveOwnEmpresaId(actor));
  }

  @Roles(Role.COACH)
  @Get('encuestas/:empresaId')
  encuestasDeEmpresa(@Param('empresaId') empresaId: string) {
    return this.satisfaccion.listarEncuestas(empresaId);
  }

  @Roles(Role.EMPRESA)
  @Post('solicitudes')
  crearSolicitud(
    @Body() dto: CreateSolicitudProcesoDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.satisfaccion.crearSolicitud(resolveOwnEmpresaId(actor), dto);
  }

  @Roles(Role.EMPRESA)
  @Get('solicitudes/me')
  misSolicitudes(@CurrentUser() actor: AuthenticatedUser) {
    return this.satisfaccion.listarSolicitudesPropias(
      resolveOwnEmpresaId(actor),
    );
  }

  @Roles(Role.COACH)
  @Get('solicitudes')
  solicitudes(@Query('estado') estado?: EstadoSolicitudProceso) {
    return this.satisfaccion.listarSolicitudes(estado);
  }

  @Roles(Role.COACH)
  @Patch('solicitudes/:id/atender')
  atenderSolicitud(@Param('id') id: string) {
    return this.satisfaccion.marcarAtendida(id);
  }

  @Roles(Role.EMPRESA)
  @Get('kpis/me')
  misKpis(@CurrentUser() actor: AuthenticatedUser) {
    return this.satisfaccion.kpis(resolveOwnEmpresaId(actor));
  }

  @Roles(Role.COACH)
  @Get('kpis/:empresaId')
  kpisDeEmpresa(@Param('empresaId') empresaId: string) {
    return this.satisfaccion.kpis(empresaId);
  }
}
