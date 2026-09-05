import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { MapasService } from './mapas.service';
import { AuditService } from '../audit/audit.service';
import { CreateMapaDto } from './dto/create-mapa.dto';
import { UpdateMapaDto } from './dto/update-mapa.dto';
import { CreateNodoDto } from './dto/create-nodo.dto';
import { UpdateNodoDto } from './dto/update-nodo.dto';
import { SetActivoDto } from './dto/set-activo.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '../auth/enums/role.enum';
import type { AuthenticatedUser } from '../auth/auth.types';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('mapas')
export class MapasController {
  constructor(
    private readonly mapas: MapasService,
    private readonly audit: AuditService,
  ) {}

  // Ruta literal del coachee primero — debe ir antes de ':id' (mismo cuidado
  // que quiz.controller.ts / flashcards.controller.ts).

  @Roles(Role.COACHEE)
  @Get('disponibles')
  disponibles(@CurrentUser() actor: AuthenticatedUser) {
    return this.mapas.disponiblesParaCoachee(actor.id);
  }

  @Roles(Role.COACH)
  @Post()
  async create(
    @Body() dto: CreateMapaDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    const mapa = await this.mapas.create(dto);
    await this.audit.record('MAPA_CREADO', {
      userId: actor.id,
      targetType: 'MapaMental',
      targetId: mapa.id,
    });
    return mapa;
  }

  @Roles(Role.COACH)
  @Get()
  findAll() {
    return this.mapas.findAll();
  }

  // Sin @Roles propio: coach y coachee ven exactamente lo mismo — no hay nada
  // que ocultar en un mapa mental (a diferencia de Quiz).
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.mapas.findOneConNodos(id);
  }

  @Roles(Role.COACH)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateMapaDto) {
    return this.mapas.update(id, dto);
  }

  @Roles(Role.COACH)
  @Patch(':id/estado')
  setActivo(@Param('id') id: string, @Body() dto: SetActivoDto) {
    return this.mapas.setActivo(id, dto.isActive);
  }

  @Roles(Role.COACH)
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    await this.mapas.remove(id);
    await this.audit.record('MAPA_ELIMINADO', {
      userId: actor.id,
      targetType: 'MapaMental',
      targetId: id,
    });
    return { success: true };
  }

  @Roles(Role.COACH)
  @Post(':id/nodos')
  addNodo(@Param('id') id: string, @Body() dto: CreateNodoDto) {
    return this.mapas.addNodo(id, dto);
  }

  @Roles(Role.COACH)
  @Patch('nodos/:nodoId')
  updateNodo(@Param('nodoId') nodoId: string, @Body() dto: UpdateNodoDto) {
    return this.mapas.updateNodo(nodoId, dto);
  }

  @Roles(Role.COACH)
  @Delete('nodos/:nodoId')
  removeNodo(@Param('nodoId') nodoId: string) {
    return this.mapas.removeNodo(nodoId);
  }
}
