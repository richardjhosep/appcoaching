import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { join } from 'path';
import type { Response } from 'express';
import { DocumentosCoacheeService } from './documentos-coachee.service';
import { CreateDocumentoCoacheeDto } from './dto/create-documento-coachee.dto';
import { almacenamientoSeguro } from '../common/almacenamiento-seguro.util';
import { UPLOADS_DIR } from '../recursos/uploads-dir.util';
import {
  MIMETYPES_DOCUMENTO_COACHEE,
  soloPermitir,
} from '../common/file-type-filter.util';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '../auth/enums/role.enum';
import type { AuthenticatedUser } from '../auth/auth.types';

const subidaDocumento = FileInterceptor('archivo', {
  storage: almacenamientoSeguro(UPLOADS_DIR, 'documento-coachee-'),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: soloPermitir(MIMETYPES_DOCUMENTO_COACHEE),
});

function exigirArchivo(archivo?: Express.Multer.File): Express.Multer.File {
  if (!archivo) throw new BadRequestException('Adjunta un archivo.');
  return archivo;
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('documentos-coachee')
export class DocumentosCoacheeController {
  constructor(private readonly documentos: DocumentosCoacheeService) {}

  // --- Coachee: sus propios documentos (id resuelto desde el JWT) ---
  @Roles(Role.COACHEE)
  @Get('me')
  misDocumentos(@CurrentUser() actor: AuthenticatedUser) {
    return this.documentos.listar(actor);
  }

  @Roles(Role.COACHEE)
  @Post('me')
  @UseInterceptors(subidaDocumento)
  subirPropio(
    @CurrentUser() actor: AuthenticatedUser,
    @Body() dto: CreateDocumentoCoacheeDto,
    @UploadedFile() archivo?: Express.Multer.File,
  ) {
    return this.documentos.subir(actor, dto, exigirArchivo(archivo));
  }

  // --- Coach / empresa: documentos de un coachee puntual ---
  @Roles(Role.COACH, Role.EMPRESA)
  @Get('coachee/:coacheeId')
  deCoachee(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('coacheeId', ParseUUIDPipe) coacheeId: string,
  ) {
    return this.documentos.listar(actor, coacheeId);
  }

  @Roles(Role.COACH, Role.EMPRESA)
  @Post('coachee/:coacheeId')
  @UseInterceptors(subidaDocumento)
  subirParaCoachee(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('coacheeId', ParseUUIDPipe) coacheeId: string,
    @Body() dto: CreateDocumentoCoacheeDto,
    @UploadedFile() archivo?: Express.Multer.File,
  ) {
    return this.documentos.subir(actor, dto, exigirArchivo(archivo), coacheeId);
  }

  // --- Los 3 roles: descargar / eliminar (el acceso se valida en el servicio) ---
  @Roles(Role.COACH, Role.EMPRESA, Role.COACHEE)
  @Get(':id/archivo')
  async archivo(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
  ) {
    const documento = await this.documentos.obtenerParaDescarga(actor, id);
    res.download(
      join(UPLOADS_DIR, documento.archivoPath),
      documento.archivoNombre,
    );
  }

  @Roles(Role.COACH, Role.EMPRESA, Role.COACHEE)
  @Delete(':id')
  async eliminar(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.documentos.eliminar(actor, id);
    return { success: true };
  }
}
