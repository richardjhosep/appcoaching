import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { DocumentoCoachee } from './entities/documento-coachee.entity';
import { CreateDocumentoCoacheeDto } from './dto/create-documento-coachee.dto';
import { CoacheesService } from '../coachees/coachees.service';
import { Role } from '../auth/enums/role.enum';
import type { AuthenticatedUser } from '../auth/auth.types';
import { UPLOADS_DIR } from '../recursos/uploads-dir.util';

@Injectable()
export class DocumentosCoacheeService {
  constructor(
    @InjectRepository(DocumentoCoachee)
    private readonly documentos: Repository<DocumentoCoachee>,
    private readonly coachees: CoacheesService,
  ) {}

  /**
   * Resuelve a qué coachee apunta el actor y valida que pueda verlo: el coach a cualquiera, la
   * empresa solo a los suyos (findOneForActor), y el coachee únicamente a sí mismo — para él el
   * id viene siempre del JWT, nunca de un parámetro.
   */
  private async resolverCoacheeId(
    actor: AuthenticatedUser,
    coacheeId?: string,
  ): Promise<string> {
    if (actor.role === Role.COACHEE) {
      const propio = await this.coachees.findByUserId(actor.id);
      if (!propio) {
        throw new NotFoundException('Perfil de coachee no encontrado.');
      }
      if (coacheeId && coacheeId !== propio.id) {
        throw new ForbiddenException('No tienes acceso a este coachee.');
      }
      return propio.id;
    }
    if (!coacheeId) {
      throw new NotFoundException('Coachee no encontrado.');
    }
    const coachee = await this.coachees.findOneForActor(coacheeId, actor);
    return coachee.id;
  }

  async listar(
    actor: AuthenticatedUser,
    coacheeId?: string,
  ): Promise<DocumentoCoachee[]> {
    const id = await this.resolverCoacheeId(actor, coacheeId);
    return this.documentos.find({
      where: { coacheeId: id },
      order: { createdAt: 'DESC' },
    });
  }

  async subir(
    actor: AuthenticatedUser,
    dto: CreateDocumentoCoacheeDto,
    archivo: Express.Multer.File,
    coacheeId?: string,
  ): Promise<DocumentoCoachee> {
    const id = await this.resolverCoacheeId(actor, coacheeId);
    return this.documentos.save(
      this.documentos.create({
        coacheeId: id,
        tipo: dto.tipo,
        descripcion: dto.descripcion?.trim() || null,
        archivoPath: archivo.filename,
        archivoNombre: archivo.originalname,
        subidoPorUserId: actor.id,
        subidoPorRol: actor.role,
      }),
    );
  }

  async obtenerParaDescarga(
    actor: AuthenticatedUser,
    id: string,
  ): Promise<DocumentoCoachee> {
    const documento = await this.documentos.findOne({ where: { id } });
    if (!documento) {
      throw new NotFoundException('Documento no encontrado.');
    }
    await this.resolverCoacheeId(actor, documento.coacheeId);
    return documento;
  }

  // Lo puede borrar quien lo subió, o el coach (dueño del proceso). Ni la empresa ni el
  // coachee borran lo que subió el otro: es justamente lo que se comparte.
  async eliminar(actor: AuthenticatedUser, id: string): Promise<void> {
    const documento = await this.obtenerParaDescarga(actor, id);
    if (actor.role !== Role.COACH && documento.subidoPorUserId !== actor.id) {
      throw new ForbiddenException(
        'Solo quien subió el documento (o el coach) puede eliminarlo.',
      );
    }
    await this.documentos.remove(documento);
    await unlink(join(UPLOADS_DIR, documento.archivoPath)).catch(() => {
      // El registro ya no existe; un archivo huérfano faltante en disco no es un error.
    });
  }
}
