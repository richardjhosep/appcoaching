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
import { FlashcardsService } from './flashcards.service';
import { AuditService } from '../audit/audit.service';
import { CreateFlashcardDto } from './dto/create-flashcard.dto';
import { UpdateFlashcardDto } from './dto/update-flashcard.dto';
import { RegistrarRepasoDto } from './dto/registrar-repaso.dto';
import { SetActivoDto } from './dto/set-activo.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '../auth/enums/role.enum';
import type { AuthenticatedUser } from '../auth/auth.types';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('flashcards')
export class FlashcardsController {
  constructor(
    private readonly flashcards: FlashcardsService,
    private readonly audit: AuditService,
  ) {}

  // Rutas literales del coachee primero — deben ir antes de ':id' (mismo
  // cuidado que quiz.controller.ts).

  @Roles(Role.COACHEE)
  @Get('disponibles')
  disponibles(@CurrentUser() actor: AuthenticatedUser) {
    return this.flashcards.disponiblesParaCoachee(actor.id);
  }

  @Roles(Role.COACHEE)
  @Get('mis-repasos')
  misRepasos(@CurrentUser() actor: AuthenticatedUser) {
    return this.flashcards.misRepasos(actor.id);
  }

  @Roles(Role.COACHEE)
  @Post(':id/repasos')
  registrarRepaso(
    @Param('id') id: string,
    @Body() dto: RegistrarRepasoDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.flashcards.registrarRepaso(actor.id, id, dto.resultado);
  }

  @Roles(Role.COACH)
  @Post()
  async create(
    @Body() dto: CreateFlashcardDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    const flashcard = await this.flashcards.create(dto);
    await this.audit.record('FLASHCARD_CREADA', {
      userId: actor.id,
      targetType: 'Flashcard',
      targetId: flashcard.id,
    });
    return flashcard;
  }

  @Roles(Role.COACH)
  @Get()
  findAll() {
    return this.flashcards.findAll();
  }

  @Roles(Role.COACH)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.flashcards.findOne(id);
  }

  @Roles(Role.COACH)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateFlashcardDto) {
    return this.flashcards.update(id, dto);
  }

  @Roles(Role.COACH)
  @Patch(':id/estado')
  setActivo(@Param('id') id: string, @Body() dto: SetActivoDto) {
    return this.flashcards.setActivo(id, dto.isActive);
  }

  @Roles(Role.COACH)
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    await this.flashcards.remove(id);
    await this.audit.record('FLASHCARD_ELIMINADA', {
      userId: actor.id,
      targetType: 'Flashcard',
      targetId: id,
    });
    return { success: true };
  }
}
