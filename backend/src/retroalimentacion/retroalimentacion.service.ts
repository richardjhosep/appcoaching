import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RetroalimentacionCierre } from './entities/retroalimentacion-cierre.entity';
import { CicloCoaching } from '../ciclos/entities/ciclo-coaching.entity';
import { CreateRetroalimentacionDto } from './dto/create-retroalimentacion.dto';
import { CoacheesService } from '../coachees/coachees.service';

@Injectable()
export class RetroalimentacionService {
  constructor(
    @InjectRepository(RetroalimentacionCierre)
    private readonly retroalimentaciones: Repository<RetroalimentacionCierre>,
    // Se registra el repositorio de CicloCoaching directamente (no CiclosModule completo)
    // para validar ownership sin crear un ciclo de módulos con CiclosModule (que en la Fase 4
    // pasa a depender de este módulo para armar el informe de cierre) — mismo patrón que
    // `Recurso` re-registrado en quiz/flashcards/mapas solo para checks de FK.
    @InjectRepository(CicloCoaching)
    private readonly ciclos: Repository<CicloCoaching>,
    private readonly coachees: CoacheesService,
  ) {}

  private async resolveCoacheeId(actorUserId: string): Promise<string> {
    const coachee = await this.coachees.findByUserId(actorUserId);
    if (!coachee) {
      throw new NotFoundException('Coachee profile not found');
    }
    return coachee.id;
  }

  async addOwn(
    actorUserId: string,
    dto: CreateRetroalimentacionDto,
  ): Promise<RetroalimentacionCierre> {
    const coacheeId = await this.resolveCoacheeId(actorUserId);
    const ciclo = await this.ciclos.findOne({
      where: { id: dto.cicloId, coacheeId },
    });
    if (!ciclo) {
      throw new NotFoundException('Ciclo not found');
    }
    const yaExiste = await this.retroalimentaciones.exists({
      where: { cicloId: dto.cicloId },
    });
    if (yaExiste) {
      throw new ConflictException(
        'Ya existe una retroalimentación registrada para este ciclo.',
      );
    }
    return this.retroalimentaciones.save(
      this.retroalimentaciones.create({
        coacheeId,
        cicloId: dto.cicloId,
        respuestas: dto.respuestas,
        loQueMasGusto: dto.loQueMasGusto ?? null,
        mayoresAprendizajes: dto.mayoresAprendizajes ?? null,
        sugerencias: dto.sugerencias ?? null,
        otrosComentarios: dto.otrosComentarios ?? null,
      }),
    );
  }

  async listOwn(actorUserId: string): Promise<RetroalimentacionCierre[]> {
    const coacheeId = await this.resolveCoacheeId(actorUserId);
    return this.listForCoachee(coacheeId);
  }

  listForCoachee(coacheeId: string): Promise<RetroalimentacionCierre[]> {
    return this.retroalimentaciones.find({
      where: { coacheeId },
      order: { createdAt: 'DESC' },
    });
  }
}
