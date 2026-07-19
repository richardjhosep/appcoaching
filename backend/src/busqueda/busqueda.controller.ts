import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { BusquedaService } from './busqueda.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('busqueda')
export class BusquedaController {
  constructor(private readonly busqueda: BusquedaService) {}

  @Roles(Role.COACH)
  @Get()
  buscar(@Query('q') q?: string) {
    return this.busqueda.buscar(q ?? '');
  }
}
