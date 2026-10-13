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
import { PerfilCoachService } from './perfil-coach.service';
import { UpdatePerfilCoachDto } from './dto/update-perfil-coach.dto';
import { CreateCertificacionDto } from './dto/create-certificacion.dto';
import { CreateExperienciaDto } from './dto/create-experiencia.dto';
import { UPLOADS_DIR } from '../recursos/uploads-dir.util';
import {
  soloPermitir,
  MIMETYPES_IMAGEN,
  MIMETYPES_PDF,
  MIMETYPES_PDF_O_IMAGEN,
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
@Controller('perfil-coach')
export class PerfilCoachController {
  constructor(private readonly perfilCoach: PerfilCoachService) {}

  @Roles(Role.COACH)
  @Get('me')
  miPerfil(@CurrentUser() actor: AuthenticatedUser) {
    return this.perfilCoach.obtenerOCrearPropio(actor.id);
  }

  @Roles(Role.COACH)
  @Patch('me')
  actualizar(
    @CurrentUser() actor: AuthenticatedUser,
    @Body() dto: UpdatePerfilCoachDto,
  ) {
    return this.perfilCoach.actualizar(actor.id, dto);
  }

  @Roles(Role.COACH)
  @Post('me/foto')
  @UseInterceptors(
    FileInterceptor('archivo', {
      storage: storageDe('foto'),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: soloPermitir(MIMETYPES_IMAGEN),
    }),
  )
  subirFoto(
    @CurrentUser() actor: AuthenticatedUser,
    @UploadedFile() archivo: Express.Multer.File,
  ) {
    return this.perfilCoach.actualizarFoto(actor.id, archivo);
  }

  @Roles(Role.COACH)
  @Post('me/cv')
  @UseInterceptors(
    FileInterceptor('archivo', {
      storage: storageDe('cv'),
      limits: { fileSize: 20 * 1024 * 1024 },
      fileFilter: soloPermitir(MIMETYPES_PDF),
    }),
  )
  subirCv(
    @CurrentUser() actor: AuthenticatedUser,
    @UploadedFile() archivo: Express.Multer.File,
  ) {
    return this.perfilCoach.actualizarCv(actor.id, archivo);
  }

  @Roles(Role.COACH)
  @Post('me/certificaciones')
  @UseInterceptors(
    FileInterceptor('archivo', {
      storage: storageDe('certificacion'),
      limits: { fileSize: 20 * 1024 * 1024 },
      fileFilter: soloPermitir(MIMETYPES_PDF_O_IMAGEN),
    }),
  )
  agregarCertificacion(
    @CurrentUser() actor: AuthenticatedUser,
    @Body() dto: CreateCertificacionDto,
    @UploadedFile() archivo?: Express.Multer.File,
  ) {
    return this.perfilCoach.agregarCertificacion(actor.id, dto, archivo);
  }

  // Edición: mismo multipart que el alta (el archivo es opcional — si no viene se conserva
  // el actual). Semántica de reemplazo completo de los campos de texto: el formulario siempre
  // manda lo que muestra, así que un opcional ausente significa "lo vació".
  @Roles(Role.COACH)
  @Patch('me/certificaciones/:id')
  @UseInterceptors(
    FileInterceptor('archivo', {
      storage: storageDe('certificacion'),
      limits: { fileSize: 20 * 1024 * 1024 },
      fileFilter: soloPermitir(MIMETYPES_PDF_O_IMAGEN),
    }),
  )
  actualizarCertificacion(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CreateCertificacionDto,
    @UploadedFile() archivo?: Express.Multer.File,
  ) {
    return this.perfilCoach.actualizarCertificacion(actor.id, id, dto, archivo);
  }

  @Roles(Role.COACH)
  @Delete('me/certificaciones/:id')
  eliminarCertificacion(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.perfilCoach.eliminarCertificacion(actor.id, id);
  }

  @Roles(Role.COACH)
  @Post('me/experiencias')
  @UseInterceptors(
    FileInterceptor('logo', {
      storage: storageDe('logo-experiencia'),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: soloPermitir(MIMETYPES_IMAGEN),
    }),
  )
  agregarExperiencia(
    @CurrentUser() actor: AuthenticatedUser,
    @Body() dto: CreateExperienciaDto,
    @UploadedFile() logo?: Express.Multer.File,
  ) {
    return this.perfilCoach.agregarExperiencia(actor.id, dto, logo);
  }

  // Mismo criterio que actualizarCertificacion.
  @Roles(Role.COACH)
  @Patch('me/experiencias/:id')
  @UseInterceptors(
    FileInterceptor('logo', {
      storage: storageDe('logo-experiencia'),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: soloPermitir(MIMETYPES_IMAGEN),
    }),
  )
  actualizarExperiencia(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CreateExperienciaDto,
    @UploadedFile() logo?: Express.Multer.File,
  ) {
    return this.perfilCoach.actualizarExperiencia(actor.id, id, dto, logo);
  }

  @Roles(Role.COACH)
  @Delete('me/experiencias/:id')
  eliminarExperiencia(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.perfilCoach.eliminarExperiencia(actor.id, id);
  }

  // Declarada antes de ':id'-like siblings — acá no hay ninguno, pero se mantiene el criterio
  // del resto del proyecto (rutas literales primero).
  @Roles(Role.COACH, Role.COACHEE, Role.EMPRESA)
  @Get()
  perfilDelCoach(@CurrentUser() actor: AuthenticatedUser) {
    return this.perfilCoach.obtenerParaActor(actor);
  }

  @Roles(Role.COACH, Role.COACHEE, Role.EMPRESA)
  @Get('foto')
  async foto(@CurrentUser() actor: AuthenticatedUser, @Res() res: Response) {
    const perfil = await this.perfilCoach.obtenerParaActor(actor);
    if (!perfil.fotoPath) {
      throw new NotFoundException(
        'El coach todavía no tiene una foto de perfil.',
      );
    }
    res.sendFile(join(UPLOADS_DIR, perfil.fotoPath));
  }

  @Roles(Role.COACH, Role.COACHEE, Role.EMPRESA)
  @Get('cv')
  async cv(@CurrentUser() actor: AuthenticatedUser, @Res() res: Response) {
    const perfil = await this.perfilCoach.obtenerParaActor(actor);
    if (!perfil.cvPath) {
      throw new NotFoundException('El coach todavía no tiene un CV cargado.');
    }
    res.download(
      join(UPLOADS_DIR, perfil.cvPath),
      perfil.cvNombre ?? perfil.cvPath,
    );
  }

  @Roles(Role.COACH, Role.COACHEE, Role.EMPRESA)
  @Get('certificaciones/:id/archivo')
  async archivoCertificacion(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const perfil = await this.perfilCoach.obtenerParaActor(actor);
    const certificacion = perfil.certificaciones?.find((c) => c.id === id);
    if (!certificacion?.archivoPath) {
      throw new NotFoundException(
        'Esta certificación no tiene un archivo asociado.',
      );
    }
    res.download(
      join(UPLOADS_DIR, certificacion.archivoPath),
      certificacion.archivoNombre ?? certificacion.archivoPath,
    );
  }

  @Roles(Role.COACH, Role.COACHEE, Role.EMPRESA)
  @Get('experiencias/:id/logo')
  async logoExperiencia(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const perfil = await this.perfilCoach.obtenerParaActor(actor);
    const experiencia = perfil.experiencias?.find((e) => e.id === id);
    if (!experiencia?.logoPath) {
      throw new NotFoundException(
        'Esta experiencia no tiene un logo asociado.',
      );
    }
    res.sendFile(join(UPLOADS_DIR, experiencia.logoPath));
  }
}
