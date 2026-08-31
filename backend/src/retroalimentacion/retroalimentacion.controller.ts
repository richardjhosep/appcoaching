import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { RetroalimentacionService } from './retroalimentacion.service';
import { CoacheesService } from '../coachees/coachees.service';
import { CreateRetroalimentacionDto } from './dto/create-retroalimentacion.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '../auth/enums/role.enum';
import type { AuthenticatedUser } from '../auth/auth.types';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('retroalimentacion')
export class RetroalimentacionController {
  constructor(
    private readonly retroalimentacion: RetroalimentacionService,
    private readonly coachees: CoacheesService,
  ) {}

  @Roles(Role.COACHEE)
  @Post()
  create(
    @Body() dto: CreateRetroalimentacionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.retroalimentacion.addOwn(actor.id, dto);
  }

  // Ruta literal ("me") declarada antes de ":coacheeId" — mismo criterio de orden de
  // rutas que el resto de la app (ver quiz.controller.ts).
  @Roles(Role.COACHEE)
  @Get('me')
  listMine(@CurrentUser() actor: AuthenticatedUser) {
    return this.retroalimentacion.listOwn(actor.id);
  }

  @Roles(Role.COACH, Role.EMPRESA)
  @Get('coachee/:coacheeId')
  async listForCoachee(
    @Param('coacheeId') coacheeId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    await this.coachees.findOneForActor(coacheeId, actor);
    return this.retroalimentacion.listForCoachee(coacheeId);
  }
}
