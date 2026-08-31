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
import { EjerciciosService } from './ejercicios.service';
import { AuditService } from '../audit/audit.service';
import { CreateEjercicioDto } from './dto/create-ejercicio.dto';
import { UpdateEjercicioDto } from './dto/update-ejercicio.dto';
import { SetActivoDto } from './dto/set-activo.dto';
import { CreateVersionDto } from './dto/create-version.dto';
import { DejarFeedbackDto } from './dto/dejar-feedback.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '../auth/enums/role.enum';
import type { AuthenticatedUser } from '../auth/auth.types';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ejercicios')
export class EjerciciosController {
  constructor(
    private readonly ejercicios: EjerciciosService,
    private readonly audit: AuditService,
  ) {}

  // Rutas literales del coachee primero — igual criterio que quiz.controller.ts:
  // deben declararse antes de ':id' para que Nest/Express no las confunda con el parámetro.

  @Roles(Role.COACHEE)
  @Get('disponibles')
  disponibles(@CurrentUser() actor: AuthenticatedUser) {
    return this.ejercicios.disponiblesParaCoachee(actor.id);
  }

  @Roles(Role.COACHEE)
  @Get(':id/mis-versiones')
  misVersiones(
    @Param('id') id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.ejercicios.misVersiones(actor.id, id);
  }

  @Roles(Role.COACHEE)
  @Post(':id/versiones')
  crearVersion(
    @Param('id') id: string,
    @Body() dto: CreateVersionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.ejercicios.crearVersion(actor.id, id, dto);
  }

  @Roles(Role.COACH)
  @Post()
  async create(
    @Body() dto: CreateEjercicioDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    const ejercicio = await this.ejercicios.create(dto);
    await this.audit.record('EJERCICIO_CREADO', {
      userId: actor.id,
      targetType: 'Ejercicio',
      targetId: ejercicio.id,
      metadata: { titulo: ejercicio.titulo },
    });
    return ejercicio;
  }

  @Roles(Role.COACH)
  @Get()
  findAll() {
    return this.ejercicios.findAll();
  }

  // Sin @Roles propio: coach ve el ejercicio con TODAS las versiones (de cualquier
  // coachee), coachee ve solo la consigna (su propio historial lo trae por separado
  // vía mis-versiones, para no exponerle versiones ajenas).
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    if (actor.role === Role.COACH) {
      return this.ejercicios.findOneParaCoach(id);
    }
    return this.ejercicios.findOneParaCoachee(id);
  }

  @Roles(Role.COACH)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateEjercicioDto) {
    return this.ejercicios.update(id, dto);
  }

  @Roles(Role.COACH)
  @Patch(':id/estado')
  setActivo(@Param('id') id: string, @Body() dto: SetActivoDto) {
    return this.ejercicios.setActivo(id, dto.isActive);
  }

  @Roles(Role.COACH)
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    await this.ejercicios.remove(id);
    await this.audit.record('EJERCICIO_ELIMINADO', {
      userId: actor.id,
      targetType: 'Ejercicio',
      targetId: id,
    });
    return { success: true };
  }

  @Roles(Role.COACH)
  @Patch('versiones/:versionId/feedback')
  dejarFeedback(
    @Param('versionId') versionId: string,
    @Body() dto: DejarFeedbackDto,
  ) {
    return this.ejercicios.dejarFeedback(versionId, dto.comentarioCoach);
  }
}
