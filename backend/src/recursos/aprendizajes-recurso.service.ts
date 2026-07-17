import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AprendizajeRecurso } from './entities/aprendizaje-recurso.entity';
import { RecursosService } from './recursos.service';
import { CoacheesService } from '../coachees/coachees.service';

@Injectable()
export class AprendizajesRecursoService {
  constructor(
    @InjectRepository(AprendizajeRecurso)
    private readonly aprendizajes: Repository<AprendizajeRecurso>,
    private readonly recursos: RecursosService,
    private readonly coachees: CoacheesService,
  ) {}

  async addOwn(
    actorUserId: string,
    recursoId: string,
    contenido: string,
  ): Promise<AprendizajeRecurso> {
    const coacheeId = await this.recursos.assertEnBibliotecaDeCoachee(
      actorUserId,
      recursoId,
    );
    return this.aprendizajes.save(
      this.aprendizajes.create({ recursoId, coacheeId, contenido }),
    );
  }

  private async resolveCoacheeId(actorUserId: string): Promise<string> {
    const coachee = await this.coachees.findByUserId(actorUserId);
    if (!coachee) {
      throw new NotFoundException('Coachee profile not found');
    }
    return coachee.id;
  }

  async listOwn(
    actorUserId: string,
    recursoId: string,
  ): Promise<AprendizajeRecurso[]> {
    const coacheeId = await this.resolveCoacheeId(actorUserId);
    return this.aprendizajes.find({
      where: { coacheeId, recursoId },
      order: { createdAt: 'DESC' },
    });
  }

  listForRecurso(recursoId: string): Promise<AprendizajeRecurso[]> {
    return this.aprendizajes.find({
      where: { recursoId },
      order: { createdAt: 'DESC' },
    });
  }

  async removeOwn(actorUserId: string, id: string): Promise<void> {
    const coacheeId = await this.resolveCoacheeId(actorUserId);
    const result = await this.aprendizajes.delete({ id, coacheeId });
    if (!result.affected) {
      throw new NotFoundException('Aprendizaje not found');
    }
  }
}
