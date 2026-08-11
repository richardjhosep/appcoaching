import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseEnumPipe,
  Post,
  Put,
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
import { LegalService } from './legal.service';
import { UpsertDocumentoLegalDto } from './dto/upsert-documento-legal.dto';
import { SubirDocumentoAdicionalDto } from './dto/subir-documento-adicional.dto';
import { TipoDocumentoLegal } from './enums/tipo-documento-legal.enum';
import { UPLOADS_DIR } from '../recursos/uploads-dir.util';
import { soloPermitir, MIMETYPES_PDF } from '../common/file-type-filter.util';
import { AuditService } from '../audit/audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';

const ARCHIVO_INTERCEPTOR = FileInterceptor('archivo', {
  storage: diskStorage({
    destination: UPLOADS_DIR,
    filename: (_req, file, cb) => {
      cb(null, `${randomUUID()}${extname(file.originalname)}`);
    },
  }),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: soloPermitir(MIMETYPES_PDF),
});

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.COACH)
@Controller('legal')
export class LegalController {
  constructor(
    private readonly legal: LegalService,
    private readonly audit: AuditService,
  ) {}

  @Get('resumen')
  resumen() {
    return this.legal.resumen();
  }

  @Get('cumplimiento')
  cumplimiento() {
    return this.legal.cumplimiento();
  }

  @Put('documentos/empresa/:empresaId/:tipo')
  @UseInterceptors(ARCHIVO_INTERCEPTOR)
  async upsertDocumentoEmpresa(
    @Param('empresaId') empresaId: string,
    @Param('tipo', new ParseEnumPipe(TipoDocumentoLegal))
    tipo: TipoDocumentoLegal,
    @Body() dto: UpsertDocumentoLegalDto,
    @CurrentUser() actor: AuthenticatedUser,
    @UploadedFile() archivo?: Express.Multer.File,
  ) {
    const documento = await this.legal.upsertDocumento(
      { empresaId },
      tipo,
      dto,
      archivo,
    );
    await this.audit.record('DOCUMENTO_LEGAL_ACTUALIZADO', {
      userId: actor.id,
      targetType: 'Empresa',
      targetId: empresaId,
      metadata: { tipo, estado: dto.estado },
    });
    return documento;
  }

  @Put('documentos/coachee/:coacheeId/:tipo')
  @UseInterceptors(ARCHIVO_INTERCEPTOR)
  async upsertDocumentoCoachee(
    @Param('coacheeId') coacheeId: string,
    @Param('tipo', new ParseEnumPipe(TipoDocumentoLegal))
    tipo: TipoDocumentoLegal,
    @Body() dto: UpsertDocumentoLegalDto,
    @CurrentUser() actor: AuthenticatedUser,
    @UploadedFile() archivo?: Express.Multer.File,
  ) {
    const documento = await this.legal.upsertDocumento(
      { coacheeId },
      tipo,
      dto,
      archivo,
    );
    await this.audit.record('DOCUMENTO_LEGAL_ACTUALIZADO', {
      userId: actor.id,
      targetType: 'Coachee',
      targetId: coacheeId,
      metadata: { tipo, estado: dto.estado },
    });
    return documento;
  }

  @Get('documentos/empresa/:empresaId/:tipo/archivo')
  async descargarArchivoEmpresa(
    @Param('empresaId') empresaId: string,
    @Param('tipo', new ParseEnumPipe(TipoDocumentoLegal))
    tipo: TipoDocumentoLegal,
    @Res() res: Response,
  ) {
    const documento = await this.legal.obtenerArchivo({ empresaId }, tipo);
    this.enviarArchivo(documento, res);
  }

  @Get('documentos/coachee/:coacheeId/:tipo/archivo')
  async descargarArchivoCoachee(
    @Param('coacheeId') coacheeId: string,
    @Param('tipo', new ParseEnumPipe(TipoDocumentoLegal))
    tipo: TipoDocumentoLegal,
    @Res() res: Response,
  ) {
    const documento = await this.legal.obtenerArchivo({ coacheeId }, tipo);
    this.enviarArchivo(documento, res);
  }

  @Get('adicionales')
  listarAdicionales() {
    return this.legal.listarAdicionales();
  }

  @Post('adicionales/empresa/:empresaId')
  @UseInterceptors(ARCHIVO_INTERCEPTOR)
  async subirAdicionalEmpresa(
    @Param('empresaId') empresaId: string,
    @Body() dto: SubirDocumentoAdicionalDto,
    @CurrentUser() actor: AuthenticatedUser,
    @UploadedFile() archivo: Express.Multer.File,
  ) {
    const documento = await this.legal.subirAdicional(
      { empresaId },
      dto.titulo,
      archivo,
    );
    await this.audit.record('DOCUMENTO_ADICIONAL_SUBIDO', {
      userId: actor.id,
      targetType: 'Empresa',
      targetId: empresaId,
      metadata: { titulo: dto.titulo },
    });
    return documento;
  }

  @Post('adicionales/coachee/:coacheeId')
  @UseInterceptors(ARCHIVO_INTERCEPTOR)
  async subirAdicionalCoachee(
    @Param('coacheeId') coacheeId: string,
    @Body() dto: SubirDocumentoAdicionalDto,
    @CurrentUser() actor: AuthenticatedUser,
    @UploadedFile() archivo: Express.Multer.File,
  ) {
    const documento = await this.legal.subirAdicional(
      { coacheeId },
      dto.titulo,
      archivo,
    );
    await this.audit.record('DOCUMENTO_ADICIONAL_SUBIDO', {
      userId: actor.id,
      targetType: 'Coachee',
      targetId: coacheeId,
      metadata: { titulo: dto.titulo },
    });
    return documento;
  }

  @Get('adicionales/:id/archivo')
  async descargarAdicional(@Param('id') id: string, @Res() res: Response) {
    const documento = await this.legal.obtenerAdicional(id);
    res.download(
      join(UPLOADS_DIR, documento.archivoPath),
      documento.archivoNombre,
    );
  }

  @Delete('adicionales/:id')
  async eliminarAdicional(@Param('id') id: string) {
    await this.legal.eliminarAdicional(id);
    return { success: true };
  }

  private enviarArchivo(
    documento: {
      archivoPath: string | null;
      archivoNombre: string | null;
    } | null,
    res: Response,
  ) {
    if (!documento?.archivoPath) {
      throw new NotFoundException(
        'Este documento no tiene un archivo adjunto.',
      );
    }
    res.download(
      join(UPLOADS_DIR, documento.archivoPath),
      documento.archivoNombre ?? documento.archivoPath,
    );
  }
}
