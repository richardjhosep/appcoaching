import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SeccionAutoconocimientoCoachee } from './entities/seccion-autoconocimiento.entity';
import { SeccionAutoconocimiento } from './enums/seccion-autoconocimiento.enum';
import { UpdateSeccionDto } from './dto/update-seccion.dto';
import { CoacheesService } from '../coachees/coachees.service';
import type { AuthenticatedUser } from '../auth/auth.types';

// Lo único que sale hacia la pantalla: sin ids ni fechas internas.
export interface SeccionAutoconocimientoVista {
  seccion: SeccionAutoconocimiento;
  contenido: string;
  complemento: string;
  compartida: boolean;
}

@Injectable()
export class AutoconocimientoService {
  constructor(
    @InjectRepository(SeccionAutoconocimientoCoachee)
    private readonly secciones: Repository<SeccionAutoconocimientoCoachee>,
    private readonly coachees: CoacheesService,
  ) {}

  // El coachee siempre se resuelve desde el JWT, nunca desde un parámetro.
  private async resolveCoacheeId(actorUserId: string): Promise<string> {
    const coachee = await this.coachees.findByUserId(actorUserId);
    if (!coachee) {
      throw new NotFoundException('Perfil de coachee no encontrado.');
    }
    return coachee.id;
  }

  private aVista(
    s: SeccionAutoconocimientoCoachee,
  ): SeccionAutoconocimientoVista {
    return {
      seccion: s.seccion,
      contenido: s.contenido,
      complemento: s.complemento,
      compartida: s.compartida,
    };
  }

  private async findCompartidas(
    coacheeId: string,
  ): Promise<SeccionAutoconocimientoVista[]> {
    const filas = await this.secciones.find({
      where: { coacheeId, compartida: true },
    });
    return filas
      .filter((s) => s.contenido.trim() || s.complemento.trim())
      .map((s) => this.aVista(s));
  }

  /** Las propias del coachee. En "Ver como" quien mira no es el titular: solo lo compartido. */
  async findOwn(
    actor: AuthenticatedUser,
  ): Promise<SeccionAutoconocimientoVista[]> {
    const coacheeId = await this.resolveCoacheeId(actor.id);
    if (actor.impersonadoPor) return this.findCompartidas(coacheeId);
    const filas = await this.secciones.find({ where: { coacheeId } });
    return filas.map((s) => this.aVista(s));
  }

  async updateOwn(
    actorUserId: string,
    seccion: SeccionAutoconocimiento,
    dto: UpdateSeccionDto,
  ): Promise<SeccionAutoconocimientoVista> {
    const coacheeId = await this.resolveCoacheeId(actorUserId);
    // Upsert de solo los campos enviados: guardar el texto y mover el interruptor casi a la
    // vez no se pisan entre sí ni chocan en la primera escritura.
    await this.secciones.upsert(
      {
        coacheeId,
        seccion,
        contenido: dto.contenido?.trim(),
        complemento: dto.complemento?.trim(),
        compartida: dto.compartida,
      },
      ['coacheeId', 'seccion'],
    );
    return this.aVista(
      await this.secciones.findOneByOrFail({ coacheeId, seccion }),
    );
  }

  /** Lo que el coach puede leer: solo secciones compartidas y con algo escrito. */
  async findCompartidasDeCoachee(
    coacheeId: string,
    actor: AuthenticatedUser,
  ): Promise<SeccionAutoconocimientoVista[]> {
    await this.coachees.findOneForActor(coacheeId, actor);
    return this.findCompartidas(coacheeId);
  }
}
