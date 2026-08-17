import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Flashcard } from './entities/flashcard.entity';
import {
  RepasoFlashcard,
  type ResultadoRepaso,
} from './entities/repaso-flashcard.entity';
import { Recurso } from '../recursos/entities/recurso.entity';
import { CreateFlashcardDto } from './dto/create-flashcard.dto';
import { UpdateFlashcardDto } from './dto/update-flashcard.dto';
import { CoacheesService } from '../coachees/coachees.service';
import { CompetenciasService } from '../competencias/competencias.service';
import { assignDefined } from '../common/assign-defined.util';

const DIAS_POR_RESULTADO: Record<ResultadoRepaso, number> = {
  olvidado: 1,
  dificil: 3,
  facil: 7,
};

// Repetición espaciada simple (Leitner básico) — regla fija, no un modelo. Exportada
// para poder testearla en aislado además de a través del service.
export function calcularProximaRevision(
  resultado: ResultadoRepaso,
  desde: Date = new Date(),
): string {
  const dias = DIAS_POR_RESULTADO[resultado];
  const fecha = new Date(desde);
  fecha.setUTCDate(fecha.getUTCDate() + dias);
  return fecha.toISOString().slice(0, 10);
}

function hoyISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export interface FlashcardConEstado {
  id: string;
  anverso: string;
  reverso: string;
  competenciaId: string;
  competencia?: { id: string; nombre: string };
  recursoId: string | null;
  activo: boolean;
  proximaRevision: string | null;
  debeRepasar: boolean;
}

@Injectable()
export class FlashcardsService {
  constructor(
    @InjectRepository(Flashcard)
    private readonly flashcards: Repository<Flashcard>,
    @InjectRepository(RepasoFlashcard)
    private readonly repasos: Repository<RepasoFlashcard>,
    @InjectRepository(Recurso) private readonly recursos: Repository<Recurso>,
    private readonly coachees: CoacheesService,
    private readonly competencias: CompetenciasService,
  ) {}

  private async assertCompetenciaExists(id: string): Promise<void> {
    if (!(await this.competencias.exists(id))) {
      throw new NotFoundException('Competencia not found');
    }
  }

  private async assertRecursoExists(id: string): Promise<void> {
    if (!(await this.recursos.exists({ where: { id } }))) {
      throw new NotFoundException('Recurso not found');
    }
  }

  private async findOrThrow(id: string): Promise<Flashcard> {
    const flashcard = await this.flashcards.findOne({
      where: { id },
      relations: { competencia: true, recurso: true },
    });
    if (!flashcard) {
      throw new NotFoundException('Flashcard not found');
    }
    return flashcard;
  }

  private async resolveCoacheeId(actorUserId: string): Promise<string> {
    const coachee = await this.coachees.findByUserId(actorUserId);
    if (!coachee) {
      throw new NotFoundException('Coachee profile not found');
    }
    return coachee.id;
  }

  async create(dto: CreateFlashcardDto): Promise<Flashcard> {
    await this.assertCompetenciaExists(dto.competenciaId);
    if (dto.recursoId) {
      await this.assertRecursoExists(dto.recursoId);
    }
    return this.flashcards.save(
      this.flashcards.create({
        anverso: dto.anverso,
        reverso: dto.reverso,
        competenciaId: dto.competenciaId,
        recursoId: dto.recursoId ?? null,
      }),
    );
  }

  findAll(): Promise<Flashcard[]> {
    return this.flashcards.find({
      relations: { competencia: true, recurso: true },
      order: { createdAt: 'DESC' },
    });
  }

  findOne(id: string): Promise<Flashcard> {
    return this.findOrThrow(id);
  }

  async update(id: string, dto: UpdateFlashcardDto): Promise<Flashcard> {
    const flashcard = await this.findOrThrow(id);
    if (dto.competenciaId !== undefined) {
      await this.assertCompetenciaExists(dto.competenciaId);
    }
    if (dto.recursoId !== undefined) {
      await this.assertRecursoExists(dto.recursoId);
    }
    assignDefined(flashcard, dto as Partial<Flashcard>);
    return this.flashcards.save(flashcard);
  }

  async setActivo(id: string, activo: boolean): Promise<Flashcard> {
    const flashcard = await this.findOrThrow(id);
    flashcard.activo = activo;
    return this.flashcards.save(flashcard);
  }

  async remove(id: string): Promise<void> {
    await this.findOrThrow(id);
    const tieneRepasos = await this.repasos.exists({
      where: { flashcardId: id },
    });
    if (tieneRepasos) {
      throw new ConflictException(
        'No se puede eliminar una flashcard que ya tiene repasos registrados — desactívala en su lugar.',
      );
    }
    await this.flashcards.delete({ id });
  }

  async disponiblesParaCoachee(
    actorUserId: string,
  ): Promise<FlashcardConEstado[]> {
    const coacheeId = await this.resolveCoacheeId(actorUserId);
    const flashcards = await this.flashcards.find({
      where: { activo: true },
      relations: { competencia: true },
      order: { createdAt: 'ASC' },
    });
    const hoy = hoyISO();

    const conEstado = await Promise.all(
      flashcards.map(async (flashcard) => {
        const ultimoRepaso = await this.repasos.findOne({
          where: { flashcardId: flashcard.id, coacheeId },
          order: { createdAt: 'DESC' },
        });
        const proximaRevision = ultimoRepaso?.proximaRevision ?? null;
        const debeRepasar = !proximaRevision || proximaRevision <= hoy;
        return {
          id: flashcard.id,
          anverso: flashcard.anverso,
          reverso: flashcard.reverso,
          competenciaId: flashcard.competenciaId,
          competencia: flashcard.competencia
            ? {
                id: flashcard.competencia.id,
                nombre: flashcard.competencia.nombre,
              }
            : undefined,
          recursoId: flashcard.recursoId,
          activo: flashcard.activo,
          proximaRevision,
          debeRepasar,
        };
      }),
    );

    // Las que tocan repasar primero.
    return conEstado.sort(
      (a, b) => Number(b.debeRepasar) - Number(a.debeRepasar),
    );
  }

  async registrarRepaso(
    actorUserId: string,
    flashcardId: string,
    resultado: ResultadoRepaso,
  ): Promise<RepasoFlashcard> {
    const coacheeId = await this.resolveCoacheeId(actorUserId);
    await this.findOrThrow(flashcardId);

    return this.repasos.save(
      this.repasos.create({
        flashcardId,
        coacheeId,
        resultado,
        proximaRevision: calcularProximaRevision(resultado),
      }),
    );
  }

  async misRepasos(actorUserId: string): Promise<RepasoFlashcard[]> {
    const coacheeId = await this.resolveCoacheeId(actorUserId);
    return this.repasos.find({
      where: { coacheeId },
      relations: { flashcard: true },
      order: { createdAt: 'DESC' },
    });
  }
}
