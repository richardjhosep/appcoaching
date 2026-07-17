import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Put,
  Query,
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
import { RecursosService } from './recursos.service';
import { AprendizajesRecursoService } from './aprendizajes-recurso.service';
import { CreateRecursoDto } from './dto/create-recurso.dto';
import { UpdateRecursoDto } from './dto/update-recurso.dto';
import { AsignarRecursoDto } from './dto/asignar-recurso.dto';
import { CreateAprendizajeDto } from './dto/create-aprendizaje.dto';
import { UPLOADS_DIR } from './uploads-dir.util';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '../auth/enums/role.enum';
import type { AuthenticatedUser } from '../auth/auth.types';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('recursos')
export class RecursosController {
  constructor(
    private readonly recursos: RecursosService,
    private readonly aprendizajes: AprendizajesRecursoService,
  ) {}

  @Roles(Role.COACH)
  @Post()
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
  create(
    @Body() dto: CreateRecursoDto,
    @UploadedFile() archivo?: Express.Multer.File,
  ) {
    return this.recursos.create(dto, archivo);
  }

  @Roles(Role.COACH, Role.COACHEE)
  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('etiqueta') etiqueta?: string,
  ) {
    return this.recursos.findAll(search, etiqueta);
  }

  @Roles(Role.COACHEE)
  @Get('me')
  misRecursos(@CurrentUser() actor: AuthenticatedUser) {
    return this.recursos.misRecursos(actor.id);
  }

  @Roles(Role.COACH)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateRecursoDto) {
    return this.recursos.update(id, dto);
  }

  @Roles(Role.COACH)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.recursos.remove(id);
  }

  @Roles(Role.COACH)
  @Put(':id/asignaciones/:coacheeId')
  asignar(
    @Param('id') id: string,
    @Param('coacheeId') coacheeId: string,
    @Body() dto: AsignarRecursoDto,
  ) {
    return this.recursos.assignForCoachee(id, coacheeId, dto.activa);
  }

  @Roles(Role.COACH)
  @Get(':id/asignaciones')
  asignacionesDeRecurso(@Param('id') id: string) {
    return this.recursos.asignacionesDeRecurso(id);
  }

  @Roles(Role.COACHEE)
  @Post(':id/autoasignar')
  autoasignar(
    @Param('id') id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.recursos.autoasignar(actor.id, id);
  }

  @Roles(Role.COACHEE)
  @Delete(':id/autoasignar')
  quitarAutoasignacion(
    @Param('id') id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.recursos.quitarAutoasignacion(actor.id, id);
  }

  @Roles(Role.COACHEE)
  @Post(':id/aprendizajes')
  addAprendizaje(
    @Param('id') id: string,
    @Body() dto: CreateAprendizajeDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.aprendizajes.addOwn(actor.id, id, dto.contenido);
  }

  @Roles(Role.COACHEE)
  @Get(':id/aprendizajes/me')
  misAprendizajes(
    @Param('id') id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.aprendizajes.listOwn(actor.id, id);
  }

  @Roles(Role.COACHEE)
  @Delete(':id/aprendizajes/me/:aprendizajeId')
  borrarAprendizaje(
    @Param('aprendizajeId') aprendizajeId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.aprendizajes.removeOwn(actor.id, aprendizajeId);
  }

  @Roles(Role.COACH)
  @Get(':id/aprendizajes')
  aprendizajesDeRecurso(@Param('id') id: string) {
    return this.aprendizajes.listForRecurso(id);
  }

  @Roles(Role.COACH, Role.COACHEE)
  @Get(':id/archivo')
  async descargar(
    @Param('id') id: string,
    @CurrentUser() actor: AuthenticatedUser,
    @Res() res: Response,
  ) {
    const recurso = await this.recursos.findOne(id);
    if (!recurso.archivoPath) {
      throw new NotFoundException('Este recurso no tiene un archivo asociado.');
    }
    if (actor.role === Role.COACHEE) {
      await this.recursos.assertCoacheePuedeDescargar(actor.id, id);
    }
    res.download(
      join(UPLOADS_DIR, recurso.archivoPath),
      recurso.archivoNombre ?? recurso.archivoPath,
    );
  }
}
