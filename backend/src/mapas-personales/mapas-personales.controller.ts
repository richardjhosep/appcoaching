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
import { MapasPersonalesService } from './mapas-personales.service';
import { CreateMapaPersonalDto } from './dto/create-mapa-personal.dto';
import { UpdateMapaPersonalDto } from './dto/update-mapa-personal.dto';
import { CreateNodoPersonalDto } from './dto/create-nodo-personal.dto';
import { UpdateNodoPersonalDto } from './dto/update-nodo-personal.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '../auth/enums/role.enum';
import type { AuthenticatedUser } from '../auth/auth.types';

// Todo Role.COACHEE — a diferencia de mapas/ (autoría del coach), acá el dueño y único
// lector es el propio coachee. Ni Role.COACH ni Role.EMPRESA tienen ninguna ruta acá.
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.COACHEE)
@Controller('mapas-personales')
export class MapasPersonalesController {
  constructor(private readonly mapasPersonales: MapasPersonalesService) {}

  @Post()
  create(
    @Body() dto: CreateMapaPersonalDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.mapasPersonales.create(actor.id, dto);
  }

  @Get()
  findAll(@CurrentUser() actor: AuthenticatedUser) {
    return this.mapasPersonales.findAllDeCoachee(actor.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.mapasPersonales.findOneConNodos(actor.id, id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateMapaPersonalDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.mapasPersonales.update(actor.id, id, dto);
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    await this.mapasPersonales.remove(actor.id, id);
    return { success: true };
  }

  @Post(':id/nodos')
  addNodo(
    @Param('id') id: string,
    @Body() dto: CreateNodoPersonalDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.mapasPersonales.addNodo(actor.id, id, dto);
  }

  @Patch('nodos/:nodoId')
  updateNodo(
    @Param('nodoId') nodoId: string,
    @Body() dto: UpdateNodoPersonalDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.mapasPersonales.updateNodo(actor.id, nodoId, dto);
  }

  @Delete('nodos/:nodoId')
  async removeNodo(
    @Param('nodoId') nodoId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    await this.mapasPersonales.removeNodo(actor.id, nodoId);
    return { success: true };
  }
}
