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
import { CompetenciasService } from './competencias.service';
import { CoacheesService } from '../coachees/coachees.service';
import { CreateCompetenciaEmpresaDto } from './dto/create-competencia-empresa.dto';
import { UpdateCompetenciaEmpresaDto } from './dto/update-competencia-empresa.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('competencias')
export class CompetenciasController {
  constructor(
    private readonly competencias: CompetenciasService,
    private readonly coachees: CoacheesService,
  ) {}

  // Catálogo global — abierto a cualquier rol autenticado, como siempre.
  @Get()
  findAll() {
    return this.competencias.findAll();
  }

  // Declaradas antes de ':id' para que Nest no las confunda con una ruta con parámetro.
  @Roles(Role.EMPRESA)
  @Get('empresa/me')
  misCompetencias(@CurrentUser() actor: AuthenticatedUser) {
    return this.competencias.findAllForEmpresa(actor.empresaId ?? '');
  }

  @Roles(Role.EMPRESA)
  @Post('empresa/me')
  crear(
    @Body() dto: CreateCompetenciaEmpresaDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.competencias.createForEmpresa(actor.empresaId ?? '', dto);
  }

  @Roles(Role.EMPRESA)
  @Patch('empresa/me/:id')
  actualizar(
    @Param('id') id: string,
    @Body() dto: UpdateCompetenciaEmpresaDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.competencias.updateForEmpresa(actor.empresaId ?? '', id, dto);
  }

  @Roles(Role.EMPRESA)
  @Delete('empresa/me/:id')
  async eliminar(
    @Param('id') id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    await this.competencias.removeForEmpresa(actor.empresaId ?? '', id);
    return { success: true };
  }

  // Lo que ve el coach al elegir qué competencia asignarle a un coachee puntual: el
  // catálogo global + las propias de la empresa de ESE coachee (o solo el global, si es
  // independiente). findOneForActor ya resuelve el acceso (un actor EMPRESA no podría ver
  // acá el coachee de otra empresa).
  @Roles(Role.COACH)
  @Get('coachee/:coacheeId')
  async paraCoachee(
    @Param('coacheeId') coacheeId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    const coachee = await this.coachees.findOneForActor(coacheeId, actor);
    return this.competencias.findVisibleFor(coachee.empresaId);
  }
}
