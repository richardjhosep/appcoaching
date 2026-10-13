import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
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

  // Competencias que el coachee puede asociar al objetivo de su plan — ver findParaPlan.
  // Ruta literal de 2 segmentos, declarada antes de 'coachee/:coacheeId'.
  @Roles(Role.COACHEE)
  @Get('plan/me')
  async paraMiPlan(@CurrentUser() actor: AuthenticatedUser) {
    const coachee = await this.coachees.findByUserId(actor.id);
    return this.competencias.findParaPlan(coachee?.empresaId ?? null);
  }

  // Lo que ve el coach al editar una empresa: su catálogo global + el manual propio que esa
  // empresa cargó desde su portal (antes el editor pedía solo GET /competencias, el global, y
  // el manual de la empresa nunca aparecía). Va después de las rutas 'empresa/me' para que
  // 'me' no se interprete como un id.
  @Roles(Role.COACH)
  @Get('empresa/:empresaId')
  paraEmpresa(@Param('empresaId', ParseUUIDPipe) empresaId: string) {
    return this.competencias.findVisibleFor(empresaId);
  }

  // Lo que ve el coach al elegir qué competencia asignarle a un coachee puntual: la misma
  // regla que ve el coachee en su plan (findParaPlan). findOneForActor ya resuelve el acceso (un actor EMPRESA no podría ver
  // acá el coachee de otra empresa).
  @Roles(Role.COACH)
  @Get('coachee/:coacheeId')
  async paraCoachee(
    @Param('coacheeId') coacheeId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    const coachee = await this.coachees.findOneForActor(coacheeId, actor);
    return this.competencias.findParaPlan(coachee.empresaId);
  }
}
