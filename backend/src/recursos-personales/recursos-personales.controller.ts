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
import { RecursosPersonalesService } from './recursos-personales.service';
import { CreateRecursoPersonalDto } from './dto/create-recurso-personal.dto';
import { UpdateRecursoPersonalDto } from './dto/update-recurso-personal.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '../auth/enums/role.enum';
import type { AuthenticatedUser } from '../auth/auth.types';

// Todo Role.COACHEE, scoped al propio coacheeId — 100% privado, mismo criterio que
// mapas-personales/ y pizarra/.
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.COACHEE)
@Controller('recursos-personales')
export class RecursosPersonalesController {
  constructor(private readonly recursos: RecursosPersonalesService) {}

  @Post()
  create(
    @Body() dto: CreateRecursoPersonalDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.recursos.create(actor.id, dto);
  }

  @Get()
  listar(@CurrentUser() actor: AuthenticatedUser) {
    return this.recursos.listar(actor.id);
  }

  @Patch(':id')
  actualizar(
    @Param('id') id: string,
    @Body() dto: UpdateRecursoPersonalDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.recursos.actualizar(actor.id, id, dto);
  }

  @Delete(':id')
  async eliminar(
    @Param('id') id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    await this.recursos.eliminar(actor.id, id);
    return { success: true };
  }
}
