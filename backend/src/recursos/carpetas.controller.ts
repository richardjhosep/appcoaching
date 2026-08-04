import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { CarpetasService } from './carpetas.service';
import { CreateCarpetaDto } from './dto/create-carpeta.dto';
import { UpdateCarpetaDto } from './dto/update-carpeta.dto';
import { SetPublicaCarpetaDto } from './dto/set-publica-carpeta.dto';
import { AsignarAccesoDto } from './dto/asignar-acceso.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '../auth/enums/role.enum';
import type { AuthenticatedUser } from '../auth/auth.types';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('carpetas')
export class CarpetasController {
  constructor(private readonly carpetas: CarpetasService) {}

  @Roles(Role.COACH)
  @Post()
  create(@Body() dto: CreateCarpetaDto) {
    return this.carpetas.create(dto);
  }

  @Roles(Role.COACH)
  @Get()
  findAll() {
    return this.carpetas.findAll();
  }

  @Roles(Role.COACHEE)
  @Get('mias')
  misCarpetas(@CurrentUser() actor: AuthenticatedUser) {
    return this.carpetas.misCarpetas(actor.id);
  }

  @Roles(Role.COACH)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCarpetaDto) {
    return this.carpetas.update(id, dto);
  }

  @Roles(Role.COACH)
  @Patch(':id/publica')
  setPublica(@Param('id') id: string, @Body() dto: SetPublicaCarpetaDto) {
    return this.carpetas.setPublica(id, dto.publica);
  }

  @Roles(Role.COACH)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.carpetas.remove(id);
  }

  @Roles(Role.COACH)
  @Put(':id/asignaciones/:coacheeId')
  asignar(
    @Param('id') id: string,
    @Param('coacheeId') coacheeId: string,
    @Body() dto: AsignarAccesoDto,
  ) {
    return this.carpetas.asignar(id, coacheeId, dto.activa, dto.expiraEn);
  }

  @Roles(Role.COACH)
  @Get(':id/asignaciones')
  asignacionesDeCarpeta(@Param('id') id: string) {
    return this.carpetas.asignacionesDeCarpeta(id);
  }

  @Roles(Role.COACH)
  @Delete(':id/asignaciones/:coacheeId')
  revocar(@Param('id') id: string, @Param('coacheeId') coacheeId: string) {
    return this.carpetas.revocar(id, coacheeId);
  }
}
