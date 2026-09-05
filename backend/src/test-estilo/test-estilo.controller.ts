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
import { TestEstiloService } from './test-estilo.service';
import { AuditService } from '../audit/audit.service';
import { CreateTestEstiloDto } from './dto/create-test-estilo.dto';
import { UpdateTestEstiloDto } from './dto/update-test-estilo.dto';
import { CreatePreguntaEstiloDto } from './dto/create-pregunta-estilo.dto';
import { UpdatePreguntaEstiloDto } from './dto/update-pregunta-estilo.dto';
import { ResponderTestEstiloDto } from './dto/responder-test-estilo.dto';
import { SetActivoDto } from './dto/set-activo.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '../auth/enums/role.enum';
import type { AuthenticatedUser } from '../auth/auth.types';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tests-estilo')
export class TestEstiloController {
  constructor(
    private readonly testEstilo: TestEstiloService,
    private readonly audit: AuditService,
  ) {}

  // Rutas literales del coachee primero — mismo cuidado que quiz.controller.ts.

  @Roles(Role.COACHEE)
  @Get('disponibles')
  disponibles(@CurrentUser() actor: AuthenticatedUser) {
    return this.testEstilo.disponiblesParaCoachee(actor.id);
  }

  @Roles(Role.COACHEE)
  @Get('mis-intentos')
  misIntentos(@CurrentUser() actor: AuthenticatedUser) {
    return this.testEstilo.misIntentos(actor.id);
  }

  @Roles(Role.COACHEE)
  @Post(':id/intentos')
  responder(
    @Param('id') id: string,
    @Body() dto: ResponderTestEstiloDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.testEstilo.responder(actor.id, id, dto.respuestas);
  }

  @Roles(Role.COACH)
  @Post()
  async create(
    @Body() dto: CreateTestEstiloDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    const test = await this.testEstilo.create(dto);
    await this.audit.record('TEST_ESTILO_CREADO', {
      userId: actor.id,
      targetType: 'TestEstilo',
      targetId: test.id,
      metadata: { titulo: test.titulo },
    });
    return test;
  }

  @Roles(Role.COACH)
  @Get()
  findAll() {
    return this.testEstilo.findAll();
  }

  // Sin @Roles propio: coach ve las categorías, coachee no (mismo criterio que quiz).
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    if (actor.role === Role.COACH) {
      return this.testEstilo.findOneParaCoach(id);
    }
    return this.testEstilo.findOneParaCoachee(id);
  }

  @Roles(Role.COACH)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTestEstiloDto) {
    return this.testEstilo.update(id, dto);
  }

  @Roles(Role.COACH)
  @Patch(':id/estado')
  setActivo(@Param('id') id: string, @Body() dto: SetActivoDto) {
    return this.testEstilo.setActivo(id, dto.isActive);
  }

  @Roles(Role.COACH)
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    await this.testEstilo.remove(id);
    await this.audit.record('TEST_ESTILO_ELIMINADO', {
      userId: actor.id,
      targetType: 'TestEstilo',
      targetId: id,
    });
    return { success: true };
  }

  @Roles(Role.COACH)
  @Post(':id/preguntas')
  addPregunta(@Param('id') id: string, @Body() dto: CreatePreguntaEstiloDto) {
    return this.testEstilo.addPregunta(id, dto);
  }

  @Roles(Role.COACH)
  @Patch('preguntas/:preguntaId')
  updatePregunta(
    @Param('preguntaId') preguntaId: string,
    @Body() dto: UpdatePreguntaEstiloDto,
  ) {
    return this.testEstilo.updatePregunta(preguntaId, dto);
  }

  @Roles(Role.COACH)
  @Delete('preguntas/:preguntaId')
  removePregunta(@Param('preguntaId') preguntaId: string) {
    return this.testEstilo.removePregunta(preguntaId);
  }

  @Roles(Role.COACH)
  @Get(':id/intentos')
  intentosDeTest(@Param('id') id: string) {
    return this.testEstilo.intentosDeTest(id);
  }
}
