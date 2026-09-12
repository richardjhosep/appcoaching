import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RecursoPersonal } from './entities/recurso-personal.entity';
import { CreateRecursoPersonalDto } from './dto/create-recurso-personal.dto';
import { UpdateRecursoPersonalDto } from './dto/update-recurso-personal.dto';
import { CoacheesService } from '../coachees/coachees.service';
import { assignDefined } from '../common/assign-defined.util';

@Injectable()
export class RecursosPersonalesService {
  constructor(
    @InjectRepository(RecursoPersonal)
    private readonly recursos: Repository<RecursoPersonal>,
    private readonly coachees: CoacheesService,
  ) {}

  private async resolveCoacheeId(actorUserId: string): Promise<string> {
    const coachee = await this.coachees.findByUserId(actorUserId);
    if (!coachee) {
      throw new NotFoundException('Perfil de coachee no encontrado.');
    }
    return coachee.id;
  }

  private async findOwned(
    id: string,
    coacheeId: string,
  ): Promise<RecursoPersonal> {
    const recurso = await this.recursos.findOne({
      where: { id, coacheeId },
    });
    if (!recurso) {
      throw new NotFoundException('Recurso personal no encontrado.');
    }
    return recurso;
  }

  async create(
    actorUserId: string,
    dto: CreateRecursoPersonalDto,
  ): Promise<RecursoPersonal> {
    const coacheeId = await this.resolveCoacheeId(actorUserId);
    return this.recursos.save(
      this.recursos.create({
        coacheeId,
        categoria: dto.categoria,
        titulo: dto.titulo,
        url: dto.url ?? null,
        notas: dto.notas ?? null,
      }),
    );
  }

  async listar(actorUserId: string): Promise<RecursoPersonal[]> {
    const coacheeId = await this.resolveCoacheeId(actorUserId);
    return this.recursos.find({
      where: { coacheeId },
      order: { createdAt: 'DESC' },
    });
  }

  async actualizar(
    actorUserId: string,
    id: string,
    dto: UpdateRecursoPersonalDto,
  ): Promise<RecursoPersonal> {
    const coacheeId = await this.resolveCoacheeId(actorUserId);
    const recurso = await this.findOwned(id, coacheeId);
    assignDefined(recurso, dto);
    return this.recursos.save(recurso);
  }

  async eliminar(actorUserId: string, id: string): Promise<void> {
    const coacheeId = await this.resolveCoacheeId(actorUserId);
    await this.findOwned(id, coacheeId);
    await this.recursos.delete({ id });
  }
}
