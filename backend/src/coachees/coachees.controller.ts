import {
  Body,
  Controller,
  Delete,
  Get,
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
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { randomUUID } from 'crypto';
import type { Response } from 'express';
import { CoacheesService } from './coachees.service';
import { AuditService } from '../audit/audit.service';
import { CreateCoacheeDto } from './dto/create-coachee.dto';
import { UpdateCoacheeDto } from './dto/update-coachee.dto';
import { UpdateMiPerfilDto } from './dto/update-mi-perfil.dto';
import { SetConsentimientoDto } from './dto/set-consentimiento.dto';
import { SetActivoDto } from './dto/set-activo.dto';
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
  diskStorage({
    destination: UPLOADS_DIR,
    filename: (_req, file, cb) => {
      cb(null, `${subcarpeta}-${randomUUID()}${extname(file.originalname)}`);
    },
  });

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
  @Patch('me/perfil')
  actualizarMiPerfil(
    @Body() dto: UpdateMiPerfilDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.coachees.actualizarMiPerfil(actor.id, dto);
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
    res.sendFile(join(UPLOADS_DIR, coachee.fotoPath));
  }

  @Roles(Role.COACH, Role.EMPRESA)
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.coachees.findOneForActor(id, actor);
  }

  // Solo Role.COACH — el consentimiento es específicamente "que mi coach me vea", la empresa
  // no entra en este intercambio. Sin gate de compartirPerfilConCoach en el backend: el coach
  // ya ve el registro completo del coachee vía findOne de arriba (objetivoProceso, tarifaPropia,
  // etc., sin redacción) — el frontend decide si llama a esta ruta según el interruptor (ver
  // PerfilTab.vue).
  @Roles(Role.COACH)
  @Get(':id/foto')
  async fotoDeCoachee(
    @Param('id') id: string,
    @CurrentUser() actor: AuthenticatedUser,
    @Res() res: Response,
  ) {
    const coachee = await this.coachees.findOneForActor(id, actor);
    if (!coachee.fotoPath) {
      throw new NotFoundException(
        'Este coachee todavía no tiene una foto de perfil.',
      );
    }
    res.sendFile(join(UPLOADS_DIR, coachee.fotoPath));
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
