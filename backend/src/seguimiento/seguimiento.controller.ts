import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { SeguimientoService } from './seguimiento.service';
import { CoacheesService } from '../coachees/coachees.service';
import { CreateLogroDto } from './dto/create-logro.dto';
import { CreateEntradaDiarioDto } from './dto/create-entrada-diario.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '../auth/enums/role.enum';
import type { AuthenticatedUser } from '../auth/auth.types';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('seguimiento')
export class SeguimientoController {
  constructor(
    private readonly seguimiento: SeguimientoService,
    private readonly coachees: CoacheesService,
  ) {}

  @Roles(Role.COACHEE)
  @Post('logros')
  addLogro(
    @Body() dto: CreateLogroDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.seguimiento.addLogroOwn(actor.id, dto);
  }

  @Roles(Role.COACHEE)
  @Get('logros/me')
  listMyLogros(@CurrentUser() actor: AuthenticatedUser) {
    return this.seguimiento.listLogrosOwn(actor.id);
  }

  @Roles(Role.COACHEE)
  @Delete('logros/me/:id')
  removeMyLogro(
    @Param('id') id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.seguimiento.removeLogroOwn(actor.id, id);
  }

  @Roles(Role.COACH, Role.EMPRESA)
  @Get('logros/:coacheeId')
  async logrosForCoachee(
    @Param('coacheeId') coacheeId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    await this.coachees.findOneForActor(coacheeId, actor);
    return this.seguimiento.listLogrosForCoachee(coacheeId);
  }

  @Roles(Role.COACHEE)
  @Get('diario/me')
  listMyDiario(@CurrentUser() actor: AuthenticatedUser) {
    return this.seguimiento.listEntradasDiarioOwn(actor.id);
  }

  @Roles(Role.COACHEE)
  @Post('diario')
  addDiario(
    @Body() dto: CreateEntradaDiarioDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.seguimiento.addEntradaDiarioOwn(actor.id, dto);
  }

  @Roles(Role.COACHEE)
  @Get('avance/me')
  async avanceMio(@CurrentUser() actor: AuthenticatedUser) {
    return { avance: await this.seguimiento.avanceGeneralOwn(actor.id) };
  }

  @Roles(Role.COACH, Role.EMPRESA)
  @Get('avance/:coacheeId')
  async avanceDeCoachee(
    @Param('coacheeId') coacheeId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    await this.coachees.findOneForActor(coacheeId, actor);
    return {
      avance: await this.seguimiento.avanceGeneralForCoachee(coacheeId),
    };
  }

  @Roles(Role.COACHEE)
  @Get('linea-progreso/me')
  lineaProgresoMia(@CurrentUser() actor: AuthenticatedUser) {
    return this.seguimiento.lineaProgresoOwn(actor.id);
  }

  @Roles(Role.COACH, Role.EMPRESA)
  @Get('linea-progreso/:coacheeId')
  async lineaProgresoDeCoachee(
    @Param('coacheeId') coacheeId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    await this.coachees.findOneForActor(coacheeId, actor);
    return this.seguimiento.lineaProgresoForCoachee(coacheeId);
  }
}
