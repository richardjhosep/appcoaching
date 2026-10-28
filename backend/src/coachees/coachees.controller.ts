import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { join } from 'path';
import type { Response } from 'express';
import { CoacheesService } from './coachees.service';
import { AuditService } from '../audit/audit.service';
import { CreateCoacheeDto } from './dto/create-coachee.dto';
import { UpdateCoacheeDto } from './dto/update-coachee.dto';
import { UpdateMiPerfilDto } from './dto/update-mi-perfil.dto';
import { SetConsentimientoDto } from './dto/set-consentimiento.dto';
import { SetActivoDto } from './dto/set-activo.dto';
import { redactarCoacheeParaRol } from './coachee-visibility.util';
import {
  almacenamientoSeguro,
  enviarArchivoSeguro,
} from '../common/almacenamiento-seguro.util';
import { UPLOADS_DIR } from '../recursos/uploads-dir.util';
import {
  soloPermitir,
  MIMETYPES_IMAGEN,
} from '../common/file-type-filter.util';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '../auth/enums/role.enum';
import type { AuthenticatedUser } from '../auth/auth.types';

const storageDe = (subcarpeta: string) =>
  almacenamientoSeguro(UPLOADS_DIR, `${subcarpeta}-`);

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
  async findAll(@CurrentUser() actor: AuthenticatedUser) {
    const lista = await this.coachees.findAllForActor(actor);
    return lista.map((c) => redactarCoacheeParaRol(c, actor.role));
  }

  @Roles(Role.COACHEE)
  @Get('me')
  findMe(@CurrentUser() actor: AuthenticatedUser) {
    return this.coachees.findByUserId(actor.id);
  }

  @Roles(Role.COACHEE)
  @Get('me/competencias-empresa')
  misCompetenciasEmpresa(@CurrentUser() actor: AuthenticatedUser) {
    return this.coachees.getMisCompetenciasEmpresa(actor.id);
  }

  @Roles(Role.COACHEE)
  @Patch('me/perfil')
  actualizarMiPerfil(
    @Body() dto: UpdateMiPerfilDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.coachees.actualizarMiPerfil(actor.id, dto);
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Roles(Role.COACHEE)
  @HttpCode(HttpStatus.OK)
  @Post('me/consentimiento-sensibles/aceptar')
  async aceptarMisDatosSensibles(@CurrentUser() actor: AuthenticatedUser) {
    const coachee = await this.coachees.aceptarMisDatosSensibles(actor.id);
    await this.audit.record('CONSENTIMIENTO_SENSIBLES_OTORGADO', {
      userId: actor.id,
      targetType: 'Coachee',
      targetId: coachee.id,
      metadata: { version: coachee.consentimientoSensiblesVersion },
    });
    return coachee;
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Roles(Role.COACHEE)
  @HttpCode(HttpStatus.OK)
  @Post('me/consentimiento-sensibles/revocar')
  async revocarMisDatosSensibles(@CurrentUser() actor: AuthenticatedUser) {
    const coachee = await this.coachees.revocarMisDatosSensibles(actor.id);
    await this.audit.record('CONSENTIMIENTO_SENSIBLES_REVOCADO', {
      userId: actor.id,
      targetType: 'Coachee',
      targetId: coachee.id,
    });
    return coachee;
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Roles(Role.COACHEE)
  @HttpCode(HttpStatus.OK)
  @Post('me/consentimiento/aceptar')
  async aceptarMiConsentimiento(@CurrentUser() actor: AuthenticatedUser) {
    const coachee = await this.coachees.aceptarMiConsentimiento(actor.id);
    await this.audit.record('CONSENTIMIENTO_ACTUALIZADO', {
      userId: actor.id,
      targetType: 'Coachee',
      targetId: coachee.id,
      metadata: { informado: true, via: 'app' },
    });
    return coachee;
  }

  @Roles(Role.COACHEE)
  @Post('me/foto')
  @UseInterceptors(
    FileInterceptor('archivo', {
      storage: storageDe('foto-coachee'),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: soloPermitir(MIMETYPES_IMAGEN),
    }),
  )
  subirMiFoto(
    @CurrentUser() actor: AuthenticatedUser,
    @UploadedFile() archivo: Express.Multer.File,
  ) {
    return this.coachees.actualizarMiFoto(actor.id, archivo);
  }

  @Roles(Role.COACHEE)
  @Get('me/foto')
  async miFoto(@CurrentUser() actor: AuthenticatedUser, @Res() res: Response) {
    const coachee = await this.coachees.findByUserId(actor.id);
    if (!coachee?.fotoPath) {
      throw new NotFoundException('Todavía no tienes una foto de perfil.');
    }
    enviarArchivoSeguro(res, join(UPLOADS_DIR, coachee.fotoPath));
  }

  @Roles(Role.COACH, Role.EMPRESA)
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    const coachee = await this.coachees.findOneForActor(id, actor);
    return redactarCoacheeParaRol(coachee, actor.role);
  }

  // Solo Role.COACH — el consentimiento es específicamente "que mi coach me vea", la empresa
  // no entra en este intercambio. La foto y la bio solo se entregan si el coachee activó
  // compartirPerfilConCoach (ver coachee-visibility.util.ts); no depende de la pantalla.
  @Roles(Role.COACH)
  @Get(':id/foto')
  async fotoDeCoachee(
    @Param('id') id: string,
    @CurrentUser() actor: AuthenticatedUser,
    @Res() res: Response,
  ) {
    const coachee = redactarCoacheeParaRol(
      await this.coachees.findOneForActor(id, actor),
      actor.role,
    );
    if (!coachee.fotoPath) {
      throw new NotFoundException(
        'Este coachee todavía no tiene una foto de perfil (o no la comparte contigo).',
      );
    }
    enviarArchivoSeguro(res, join(UPLOADS_DIR, coachee.fotoPath));
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
  async remove(
    @Param('id') id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    const nombre = await this.coachees.remove(id);
    await this.audit.record('COACHEE_ELIMINADO', {
      userId: actor.id,
      targetType: 'Coachee',
      targetId: id,
      targetLabel: nombre,
    });
    return { success: true };
  }

  @Roles(Role.COACH)
  @Patch(':id/consentimiento')
  async setConsentimiento(
    @Param('id') id: string,
    @Body() dto: SetConsentimientoDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    const coachee = await this.coachees.setConsentimiento(id, dto.informado);
    await this.audit.record('CONSENTIMIENTO_ACTUALIZADO', {
      userId: actor.id,
      targetType: 'Coachee',
      targetId: id,
      metadata: { informado: dto.informado, via: 'manual' },
    });
    return coachee;
  }

  @Roles(Role.COACH)
  @Post(':id/consentimiento/solicitar')
  async solicitarConsentimiento(
    @Param('id') id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    await this.coachees.solicitarConsentimiento(id);
    await this.audit.record('SOLICITUD_CONSENTIMIENTO_ENVIADA', {
      userId: actor.id,
      targetType: 'Coachee',
      targetId: id,
    });
    return { success: true };
  }
}
