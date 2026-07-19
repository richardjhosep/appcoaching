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
import { PlanesDesarrolloService } from './planes-desarrollo.service';
import { AuditService } from '../audit/audit.service';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { CreateObjetivoDto } from './dto/create-objetivo.dto';
import { UpdateObjetivoDto } from './dto/update-objetivo.dto';
import { CreateActividadDto } from './dto/create-actividad.dto';
import { UpdateActividadDto } from './dto/update-actividad.dto';
import { SolicitarCambiosDto } from './dto/solicitar-cambios.dto';
import { EstadoPlan } from './enums/estado-plan.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '../auth/enums/role.enum';
import type { AuthenticatedUser } from '../auth/auth.types';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('planes-desarrollo')
export class PlanesDesarrolloController {
  constructor(
    private readonly planes: PlanesDesarrolloService,
    private readonly audit: AuditService,
  ) {}

  @Roles(Role.COACHEE)
  @Get('me')
  getOwn(@CurrentUser() actor: AuthenticatedUser) {
    return this.planes.getOwn(actor.id);
  }

  @Roles(Role.COACHEE)
  @Patch('me')
  updateOwn(
    @Body() dto: UpdatePlanDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.planes.updateOwn(actor.id, dto);
  }

  @Roles(Role.COACHEE)
  @Post('me/enviar')
  enviar(@CurrentUser() actor: AuthenticatedUser) {
    return this.planes.enviar(actor.id);
  }

  @Roles(Role.COACHEE)
  @Post('me/objetivos')
  addObjetivo(
    @Body() dto: CreateObjetivoDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.planes.addObjetivo(actor.id, dto);
  }

  @Roles(Role.COACHEE)
  @Patch('me/objetivos/:objetivoId')
  updateObjetivo(
    @Param('objetivoId') objetivoId: string,
    @Body() dto: UpdateObjetivoDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.planes.updateObjetivo(actor.id, objetivoId, dto);
  }

  @Roles(Role.COACHEE)
  @Delete('me/objetivos/:objetivoId')
  removeObjetivo(
    @Param('objetivoId') objetivoId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.planes.removeObjetivo(actor.id, objetivoId);
  }

  @Roles(Role.COACHEE)
  @Post('me/actividades')
  addActividad(
    @Body() dto: CreateActividadDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.planes.addActividad(actor.id, dto);
  }

  @Roles(Role.COACHEE)
  @Patch('me/actividades/:actividadId')
  updateActividad(
    @Param('actividadId') actividadId: string,
    @Body() dto: UpdateActividadDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.planes.updateActividad(actor.id, actividadId, dto);
  }

  @Roles(Role.COACHEE)
  @Delete('me/actividades/:actividadId')
  removeActividad(
    @Param('actividadId') actividadId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.planes.removeActividad(actor.id, actividadId);
  }

  @Roles(Role.COACH)
  @Get()
  findAll(@Query('estado') estado?: EstadoPlan) {
    return this.planes.findAll(estado);
  }

  @Roles(Role.COACH)
  @Get(':coacheeId')
  findOne(@Param('coacheeId') coacheeId: string) {
    return this.planes.getByCoacheeId(coacheeId);
  }

  @Roles(Role.COACH)
  @Post(':coacheeId/aprobar')
  async aprobar(
    @Param('coacheeId') coacheeId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    const plan = await this.planes.aprobar(coacheeId);
    await this.audit.record('PLAN_APROBADO', {
      userId: actor.id,
      targetType: 'Coachee',
      targetId: coacheeId,
    });
    return plan;
  }

  @Roles(Role.COACH)
  @Post(':coacheeId/solicitar-cambios')
  async solicitarCambios(
    @Param('coacheeId') coacheeId: string,
    @Body() dto: SolicitarCambiosDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    const plan = await this.planes.solicitarCambios(coacheeId, dto.comentario);
    await this.audit.record('PLAN_CAMBIOS_SOLICITADOS', {
      userId: actor.id,
      targetType: 'Coachee',
      targetId: coacheeId,
      metadata: { comentario: dto.comentario },
    });
    return plan;
  }
}
