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
import { CoacheesService } from './coachees.service';
import { AuditService } from '../audit/audit.service';
import { CreateCoacheeDto } from './dto/create-coachee.dto';
import { UpdateCoacheeDto } from './dto/update-coachee.dto';
import { UpdateContactoDto } from './dto/update-contacto.dto';
import { SetConsentimientoDto } from './dto/set-consentimiento.dto';
import { SetActivoDto } from './dto/set-activo.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '../auth/enums/role.enum';
import type { AuthenticatedUser } from '../auth/auth.types';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('coachees')
export class CoacheesController {
  constructor(
    private readonly coachees: CoacheesService,
    private readonly audit: AuditService,
  ) {}

  @Roles(Role.COACH)
  @Post()
  create(@Body() dto: CreateCoacheeDto) {
    return this.coachees.create(dto);
  }

  @Roles(Role.COACH, Role.EMPRESA)
  @Get()
  findAll(@CurrentUser() actor: AuthenticatedUser) {
    return this.coachees.findAllForActor(actor);
  }

  @Roles(Role.COACHEE)
  @Get('me')
  findMe(@CurrentUser() actor: AuthenticatedUser) {
    return this.coachees.findByUserId(actor.id);
  }

  @Roles(Role.COACHEE)
  @Patch('me/contact')
  updateMyContact(
    @Body() dto: UpdateContactoDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.coachees.updateOwnContact(actor.id, dto);
  }

  @Roles(Role.COACH, Role.EMPRESA)
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.coachees.findOneForActor(id, actor);
  }

  @Roles(Role.COACH)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCoacheeDto) {
    return this.coachees.update(id, dto);
  }

  @Roles(Role.COACH)
  @Patch(':id/estado')
  setActivo(@Param('id') id: string, @Body() dto: SetActivoDto) {
    return this.coachees.setActivo(id, dto.activo);
  }

  @Roles(Role.COACH)
  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    await this.coachees.remove(id);
    await this.audit.record('COACHEE_ELIMINADO', {
      userId: actor.id,
      targetType: 'Coachee',
      targetId: id,
    });
    return { success: true };
  }

  @Roles(Role.COACH)
  @Patch(':id/consentimiento')
  setConsentimiento(
    @Param('id') id: string,
    @Body() dto: SetConsentimientoDto,
  ) {
    return this.coachees.setConsentimiento(id, dto.informado);
  }
}
