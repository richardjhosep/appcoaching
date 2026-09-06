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
import { PizarraService } from './pizarra.service';
import { CreateNotaPizarraDto } from './dto/create-nota-pizarra.dto';
import { UpdateNotaPizarraDto } from './dto/update-nota-pizarra.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '../auth/enums/role.enum';
import type { AuthenticatedUser } from '../auth/auth.types';

// Todo Role.COACHEE, scoped al propio coacheeId — 100% privado, mismo criterio que
// mapas-personales/.
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.COACHEE)
@Controller('pizarra')
export class PizarraController {
  constructor(private readonly pizarra: PizarraService) {}

  @Post()
  create(
    @Body() dto: CreateNotaPizarraDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.pizarra.create(actor.id, dto);
  }

  @Get()
  listar(@CurrentUser() actor: AuthenticatedUser) {
    return this.pizarra.listar(actor.id);
  }

  @Patch(':id')
  actualizar(
    @Param('id') id: string,
    @Body() dto: UpdateNotaPizarraDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.pizarra.actualizar(actor.id, id, dto);
  }

  @Delete(':id')
  async eliminar(
    @Param('id') id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    await this.pizarra.eliminar(actor.id, id);
    return { success: true };
  }
}
