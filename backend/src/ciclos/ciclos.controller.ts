import {
  Body,
  Controller,
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
import { CiclosService } from './ciclos.service';
import { AbrirCicloDto } from './dto/abrir-ciclo.dto';
import { CerrarCicloDto } from './dto/cerrar-ciclo.dto';
import { UpdateResumenDto } from './dto/update-resumen.dto';
import { UpdateInformeFinalDto } from './dto/update-informe-final.dto';
import { UPLOADS_DIR } from '../recursos/uploads-dir.util';
import { CoacheesService } from '../coachees/coachees.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '../auth/enums/role.enum';
import type { AuthenticatedUser } from '../auth/auth.types';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ciclos')
export class CiclosController {
  constructor(
    private readonly ciclos: CiclosService,
    private readonly coachees: CoacheesService,
  ) {}

  @Roles(Role.COACH)
  @Post()
  abrir(@Body() dto: AbrirCicloDto) {
    return this.ciclos.abrir(dto);
  }

  @Roles(Role.COACHEE)
  @Get('me')
  misCiclos(@CurrentUser() actor: AuthenticatedUser) {
    return this.ciclos.findAllOwn(actor.id);
  }

  @Roles(Role.COACHEE)
  @Get('me/actual')
  miCicloActual(@CurrentUser() actor: AuthenticatedUser) {
    return this.ciclos.findCurrentOwn(actor.id);
  }

  @Roles(Role.COACH, Role.EMPRESA)
  @Get('coachee/:coacheeId')
  async ciclosDeCoachee(
    @Param('coacheeId') coacheeId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    await this.coachees.findOneForActor(coacheeId, actor);
    return this.ciclos.findAllForCoachee(coacheeId);
  }

  @Roles(Role.COACH, Role.EMPRESA)
  @Get('coachee/:coacheeId/actual')
  async cicloActualDeCoachee(
    @Param('coacheeId') coacheeId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    await this.coachees.findOneForActor(coacheeId, actor);
    return this.ciclos.findCurrentForCoachee(coacheeId);
  }

  @Roles(Role.COACH)
  @Patch(':id/resumen-reunion-inicial')
  actualizarResumen(@Param('id') id: string, @Body() dto: UpdateResumenDto) {
    return this.ciclos.updateResumen(id, dto.resumenReunionInicial);
  }

  @Roles(Role.COACH)
  @Patch(':id/informe-final')
  actualizarInformeFinal(
    @Param('id') id: string,
    @Body() dto: UpdateInformeFinalDto,
  ) {
    return this.ciclos.updateInformeFinal(id, dto.informeFinal);
  }

  @Roles(Role.COACH)
  @Post(':id/generar-borrador-informe')
  generarBorrador(@Param('id') id: string) {
    return this.ciclos.generarBorradorInforme(id);
  }

  @Roles(Role.COACH)
  @Post(':id/informe-pdf')
  @UseInterceptors(
    FileInterceptor('archivo', {
      storage: diskStorage({
        destination: UPLOADS_DIR,
        filename: (_req, file, cb) => {
          cb(null, `${randomUUID()}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: 20 * 1024 * 1024 },
    }),
  )
  subirInformePdf(
    @Param('id') id: string,
    @UploadedFile() archivo: Express.Multer.File,
  ) {
    return this.ciclos.uploadInformePdf(id, archivo);
  }

  @Roles(Role.COACH, Role.COACHEE, Role.EMPRESA)
  @Get(':id/informe-pdf')
  async descargarInformePdf(
    @Param('id') id: string,
    @CurrentUser() actor: AuthenticatedUser,
    @Res() res: Response,
  ) {
    const ciclo = await this.ciclos.assertPuedeDescargarPdf(id, actor);
    if (!ciclo.informePdfPath) {
      throw new NotFoundException(
        'Este ciclo no tiene un informe en PDF asociado.',
      );
    }
    res.download(
      join(UPLOADS_DIR, ciclo.informePdfPath),
      ciclo.informePdfNombre ?? ciclo.informePdfPath,
    );
  }

  @Roles(Role.COACH)
  @Post(':id/cerrar')
  cerrar(@Param('id') id: string, @Body() dto: CerrarCicloDto) {
    return this.ciclos.cerrar(id, dto.resultado);
  }

  @Roles(Role.COACH)
  @Get(':id')
  obtener(@Param('id') id: string) {
    return this.ciclos.findOneWithEstado(id);
  }
}
