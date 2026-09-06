import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ProspectosService } from './prospectos.service';
import { AuditService } from '../audit/audit.service';
import { CreateProspectoDto } from './dto/create-prospecto.dto';
import { UpdateProspectoDto } from './dto/update-prospecto.dto';
import { CreateGestionProspectoDto } from './dto/create-gestion-prospecto.dto';
import { MarcarPerdidoDto } from './dto/marcar-perdido.dto';
import { CreateEmpresaDto } from '../empresas/dto/create-empresa.dto';
import { CreateCoacheeDto } from '../coachees/dto/create-coachee.dto';
import { EtapaProspecto } from './enums/etapa-prospecto.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';

// Solo el coach ve prospectos: ni Empresa ni Coachee son actores todavía en esta etapa.
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('prospectos')
export class ProspectosController {
  constructor(
    private readonly prospectos: ProspectosService,
    private readonly audit: AuditService,
  ) {}

  @Roles(Role.COACH)
  @Post()
  create(@Body() dto: CreateProspectoDto) {
    return this.prospectos.create(dto);
  }

  @Roles(Role.COACH)
  @Get()
  findAll(@Query('etapa') etapa?: EtapaProspecto) {
    return this.prospectos.findAll(etapa);
  }

  @Roles(Role.COACH)
  @Get('pipeline-ponderado')
  pipelinePonderado() {
    return this.prospectos.pipelinePonderado();
  }

  @Roles(Role.COACH)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.prospectos.findById(id);
  }

  @Roles(Role.COACH)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProspectoDto) {
    return this.prospectos.update(id, dto);
  }

  @Roles(Role.COACH)
  @Delete(':id')
  async eliminar(
    @Param('id') id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    const nombre = await this.prospectos.eliminar(id);
    await this.audit.record('PROSPECTO_ELIMINADO', {
      userId: actor.id,
      targetType: 'Prospecto',
      targetId: id,
      targetLabel: nombre,
    });
    return { success: true };
  }

  @Roles(Role.COACH)
  @Post(':id/gestion')
  crearGestion(
    @Param('id') id: string,
    @Body() dto: CreateGestionProspectoDto,
  ) {
    return this.prospectos.crearGestion(id, dto);
  }

  @Roles(Role.COACH)
  @Get(':id/gestion')
  listGestion(@Param('id') id: string) {
    return this.prospectos.listGestionDeProspecto(id);
  }

  @Roles(Role.COACH)
  @Post(':id/convertir-empresa')
  convertirAEmpresa(@Param('id') id: string, @Body() dto: CreateEmpresaDto) {
    return this.prospectos.convertirAEmpresa(id, dto);
  }

  @Roles(Role.COACH)
  @Post(':id/convertir-coachee')
  convertirACoachee(@Param('id') id: string, @Body() dto: CreateCoacheeDto) {
    return this.prospectos.convertirACoachee(id, dto);
  }

  @Roles(Role.COACH)
  @Post(':id/marcar-perdido')
  marcarPerdido(@Param('id') id: string, @Body() dto: MarcarPerdidoDto) {
    return this.prospectos.marcarPerdido(id, dto.motivo);
  }
}
