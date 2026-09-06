import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotaPizarra } from './entities/nota-pizarra.entity';
import { CreateNotaPizarraDto } from './dto/create-nota-pizarra.dto';
import { UpdateNotaPizarraDto } from './dto/update-nota-pizarra.dto';
import { CoacheesService } from '../coachees/coachees.service';
import { assignDefined } from '../common/assign-defined.util';

const COLOR_POR_DEFECTO = '#fef3c7';

@Injectable()
export class PizarraService {
  constructor(
    @InjectRepository(NotaPizarra)
    private readonly notas: Repository<NotaPizarra>,
    private readonly coachees: CoacheesService,
  ) {}

  private async resolveCoacheeId(actorUserId: string): Promise<string> {
    const coachee = await this.coachees.findByUserId(actorUserId);
    if (!coachee) {
      throw new NotFoundException('Perfil de coachee no encontrado.');
    }
    return coachee.id;
  }

  private async findNotaOwned(
    notaId: string,
    coacheeId: string,
  ): Promise<NotaPizarra> {
    const nota = await this.notas.findOne({
      where: { id: notaId, coacheeId },
    });
    if (!nota) {
      throw new NotFoundException('Nota no encontrada.');
    }
    return nota;
  }

  async create(
    actorUserId: string,
    dto: CreateNotaPizarraDto,
  ): Promise<NotaPizarra> {
    const coacheeId = await this.resolveCoacheeId(actorUserId);
    return this.notas.save(
      this.notas.create({
        coacheeId,
        posX: dto.posX,
        posY: dto.posY,
        color: dto.color ?? COLOR_POR_DEFECTO,
        texto: dto.texto ?? '',
      }),
    );
  }

  async listar(actorUserId: string): Promise<NotaPizarra[]> {
    const coacheeId = await this.resolveCoacheeId(actorUserId);
    return this.notas.find({
      where: { coacheeId },
      order: { createdAt: 'ASC' },
    });
  }

  async actualizar(
    actorUserId: string,
    notaId: string,
    dto: UpdateNotaPizarraDto,
  ): Promise<NotaPizarra> {
    const coacheeId = await this.resolveCoacheeId(actorUserId);
    const nota = await this.findNotaOwned(notaId, coacheeId);
    assignDefined(nota, dto);
    return this.notas.save(nota);
  }

  async eliminar(actorUserId: string, notaId: string): Promise<void> {
    const coacheeId = await this.resolveCoacheeId(actorUserId);
    await this.findNotaOwned(notaId, coacheeId);
    await this.notas.delete({ id: notaId });
  }
}
