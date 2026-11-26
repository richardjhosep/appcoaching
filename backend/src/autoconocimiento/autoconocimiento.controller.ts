import {
  Body,
  Controller,
  Get,
  Param,
  ParseEnumPipe,
  ParseUUIDPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { AutoconocimientoService } from './autoconocimiento.service';
import { UpdateSeccionDto } from './dto/update-seccion.dto';
import { SeccionAutoconocimiento } from './enums/seccion-autoconocimiento.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '../auth/enums/role.enum';
import type { AuthenticatedUser } from '../auth/auth.types';

// Escribe solo el coachee; el coach lee únicamente lo compartido. La empresa no tiene rutas acá.
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('autoconocimiento')
export class AutoconocimientoController {
  constructor(private readonly autoconocimiento: AutoconocimientoService) {}

  @Roles(Role.COACHEE)
  @Get('me')
  findOwn(@CurrentUser() actor: AuthenticatedUser) {
    return this.autoconocimiento.findOwn(actor);
  }

  @Roles(Role.COACHEE)
  @Patch('me/:seccion')
  updateOwn(
    @Param('seccion', new ParseEnumPipe(SeccionAutoconocimiento))
    seccion: SeccionAutoconocimiento,
    @Body() dto: UpdateSeccionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.autoconocimiento.updateOwn(actor.id, seccion, dto);
  }

  @Roles(Role.COACH)
  @Get('coachee/:coacheeId')
  findCompartidas(
    @Param('coacheeId', ParseUUIDPipe) coacheeId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.autoconocimiento.findCompartidasDeCoachee(coacheeId, actor);
  }
}
