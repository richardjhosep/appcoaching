import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SesionesService } from './sesiones.service';
import { PostSesionesService } from './post-sesiones.service';
import { SolicitudesReagendamientoService } from './solicitudes-reagendamiento.service';
import { CreateSesionDto } from './dto/create-sesion.dto';
import { UpdateSesionDto } from './dto/update-sesion.dto';
import { UpdatePostSesionDto } from './dto/update-post-sesion.dto';
import { CreateSolicitudDto } from './dto/create-solicitud.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '../auth/enums/role.enum';
import type { AuthenticatedUser } from '../auth/auth.types';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('sesiones')
export class SesionesController {
  constructor(
    private readonly sesiones: SesionesService,
    private readonly postSesiones: PostSesionesService,
    private readonly solicitudes: SolicitudesReagendamientoService,
  ) {}

  @Roles(Role.COACH)
  @Post()
  create(@Body() dto: CreateSesionDto) {
    return this.sesiones.create(dto);
  }

  @Roles(Role.COACH)
  @Get()
  async findAll(@Query('coacheeId') coacheeId?: string) {
    const sesiones = await this.sesiones.findAllForCoach(coacheeId);
    return this.withPostSesiones(sesiones);
  }

  @Roles(Role.COACHEE)
  @Get('me')
  async findMine(@CurrentUser() actor: AuthenticatedUser) {
    const sesiones = await this.sesiones.findAllForCoachee(actor.id);
    return this.withPostSesiones(sesiones);
  }

  @Roles(Role.COACHEE)
  @Get('me/proxima')
  findProxima(@CurrentUser() actor: AuthenticatedUser) {
    return this.sesiones.findProximaForCoachee(actor.id);
  }

  @Roles(Role.COACHEE)
  @Post(':id/reagendamiento')
  solicitarReagendamiento(
    @Param('id') id: string,
    @Body() dto: CreateSolicitudDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.solicitudes.create(id, actor.id, dto.motivo);
  }

  @Roles(Role.COACHEE)
  @Patch(':id/post-sesion')
  guardarPostSesion(
    @Param('id') id: string,
    @Body() dto: UpdatePostSesionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.postSesiones.upsertOwn(actor.id, id, dto);
  }

  @Roles(Role.COACHEE)
  @Post(':id/post-sesion/publicar')
  publicarPostSesion(
    @Param('id') id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.postSesiones.publicarOwn(actor.id, id);
  }

  private async withPostSesiones<T extends { id: string }>(
    sesiones: T[],
  ): Promise<Array<T & { postSesion: unknown }>> {
    return Promise.all(
      sesiones.map(async (sesion) => ({
        ...sesion,
        postSesion: await this.postSesiones.findForSesion(sesion.id),
      })),
    );
  }

  @Roles(Role.COACH)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.sesiones.findOneFull(id);
  }

  @Roles(Role.COACH)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSesionDto) {
    return this.sesiones.update(id, dto);
  }

  @Roles(Role.COACH)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.sesiones.remove(id);
  }
}
