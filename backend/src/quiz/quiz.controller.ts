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
import { QuizService } from './quiz.service';
import { AuditService } from '../audit/audit.service';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { CreatePreguntaDto } from './dto/create-pregunta.dto';
import { UpdatePreguntaDto } from './dto/update-pregunta.dto';
import { ResponderQuizDto } from './dto/responder-quiz.dto';
import { SetActivoDto } from './dto/set-activo.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '../auth/enums/role.enum';
import type { AuthenticatedUser } from '../auth/auth.types';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('quizzes')
export class QuizController {
  constructor(
    private readonly quiz: QuizService,
    private readonly audit: AuditService,
  ) {}

  // Rutas literales del coachee primero — deben declararse antes de ':id'
  // para que Nest/Express no las confunda con el parámetro (mismo cuidado
  // que ya tiene planes-desarrollo.controller.ts con sus rutas /me).

  @Roles(Role.COACHEE)
  @Get('disponibles')
  disponibles(@CurrentUser() actor: AuthenticatedUser) {
    return this.quiz.disponiblesParaCoachee(actor.id);
  }

  @Roles(Role.COACHEE)
  @Get('mis-intentos')
  misIntentos(@CurrentUser() actor: AuthenticatedUser) {
    return this.quiz.misIntentos(actor.id);
  }

  @Roles(Role.COACHEE)
  @Post(':id/intentos')
  responder(
    @Param('id') id: string,
    @Body() dto: ResponderQuizDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.quiz.responder(actor.id, id, dto.respuestas);
  }

  @Roles(Role.COACH)
  @Post()
  async create(
    @Body() dto: CreateQuizDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    const quiz = await this.quiz.create(dto);
    await this.audit.record('QUIZ_CREADO', {
      userId: actor.id,
      targetType: 'Quiz',
      targetId: quiz.id,
      metadata: { titulo: quiz.titulo },
    });
    return quiz;
  }

  @Roles(Role.COACH)
  @Get()
  findAll() {
    return this.quiz.findAll();
  }

  // Sin @Roles propio: coach y coachee ven versiones distintas del mismo quiz
  // (el service decide qué campos incluir según el rol del actor).
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    if (actor.role === Role.COACH) {
      return this.quiz.findOneParaCoach(id);
    }
    return this.quiz.findOneParaCoachee(id);
  }

  @Roles(Role.COACH)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateQuizDto) {
    return this.quiz.update(id, dto);
  }

  @Roles(Role.COACH)
  @Patch(':id/estado')
  setActivo(@Param('id') id: string, @Body() dto: SetActivoDto) {
    return this.quiz.setActivo(id, dto.isActive);
  }

  @Roles(Role.COACH)
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    await this.quiz.remove(id);
    await this.audit.record('QUIZ_ELIMINADO', {
      userId: actor.id,
      targetType: 'Quiz',
      targetId: id,
    });
    return { success: true };
  }

  @Roles(Role.COACH)
  @Post(':id/preguntas')
  addPregunta(@Param('id') id: string, @Body() dto: CreatePreguntaDto) {
    return this.quiz.addPregunta(id, dto);
  }

  @Roles(Role.COACH)
  @Patch('preguntas/:preguntaId')
  updatePregunta(
    @Param('preguntaId') preguntaId: string,
    @Body() dto: UpdatePreguntaDto,
  ) {
    return this.quiz.updatePregunta(preguntaId, dto);
  }

  @Roles(Role.COACH)
  @Delete('preguntas/:preguntaId')
  removePregunta(@Param('preguntaId') preguntaId: string) {
    return this.quiz.removePregunta(preguntaId);
  }

  @Roles(Role.COACH)
  @Get(':id/intentos')
  intentosDeQuiz(@Param('id') id: string) {
    return this.quiz.intentosDeQuiz(id);
  }
}
