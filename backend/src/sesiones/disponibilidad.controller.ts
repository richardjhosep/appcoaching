import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { DisponibilidadService } from './disponibilidad.service';
import { CreateBloqueDisponibilidadDto } from './dto/create-bloque-disponibilidad.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('disponibilidad')
export class DisponibilidadController {
  constructor(private readonly disponibilidad: DisponibilidadService) {}

  @Roles(Role.COACH, Role.COACHEE)
  @Get()
  listBloques() {
    return this.disponibilidad.listBloques();
  }

  // Declarada antes que cualquier ':param' del propio controller para no perder la ruta
  // literal (mismo criterio que el resto del repo).
  @Roles(Role.COACH, Role.COACHEE)
  @Get('slots')
  async slots(@Query('desde') desde: string, @Query('hasta') hasta: string) {
    const libres = await this.disponibilidad.calcularSlotsLibres(
      new Date(desde),
      new Date(hasta),
    );
    return libres.map((fecha) => fecha.toISOString());
  }

  @Roles(Role.COACH)
  @Post()
  crearBloque(@Body() dto: CreateBloqueDisponibilidadDto) {
    return this.disponibilidad.crearBloque(dto);
  }

  @Roles(Role.COACH)
  @Delete(':id')
  eliminarBloque(@Param('id') id: string) {
    return this.disponibilidad.eliminarBloque(id);
  }
}
