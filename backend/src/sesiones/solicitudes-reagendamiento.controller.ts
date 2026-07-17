import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { SolicitudesReagendamientoService } from './solicitudes-reagendamiento.service';
import { ResponderSolicitudDto } from './dto/responder-solicitud.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.COACH)
@Controller('solicitudes-reagendamiento')
export class SolicitudesReagendamientoController {
  constructor(private readonly solicitudes: SolicitudesReagendamientoService) {}

  @Get()
  findAllPending() {
    return this.solicitudes.findAllPending();
  }

  @Post(':id/responder')
  responder(@Param('id') id: string, @Body() dto: ResponderSolicitudDto) {
    return this.solicitudes.responder(id, dto);
  }
}
