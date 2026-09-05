import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { TestEstilo } from './entities/test-estilo.entity';
import { PreguntaEstilo } from './entities/pregunta-estilo.entity';
import { IntentoEstilo } from './entities/intento-estilo.entity';
import { CreateTestEstiloDto } from './dto/create-test-estilo.dto';
import { UpdateTestEstiloDto } from './dto/update-test-estilo.dto';
import { CreatePreguntaEstiloDto } from './dto/create-pregunta-estilo.dto';
import { UpdatePreguntaEstiloDto } from './dto/update-pregunta-estilo.dto';
import { CoacheesService } from '../coachees/coachees.service';
import { CompetenciasService } from '../competencias/competencias.service';
import { PlanesDesarrolloService } from '../planes-desarrollo/planes-desarrollo.service';
import { assignDefined } from '../common/assign-defined.util';
import { finDelDiaChileAUtc } from '../common/chile-time.util';

export interface PreguntaParaResponder {
  id: string;
  opcionA: string;
  opcionB: string;
  orden: number;
}

export interface TestEstiloParaResponder {
  id: string;
  titulo: string;
  descripcion: string | null;
  competenciaId: string | null;
  preguntas: PreguntaParaResponder[];
}

export interface TestEstiloResumen {
  id: string;
  titulo: string;
  descripcion: string | null;
  competenciaId: string | null;
  competencia?: { id: string; nombre: string };
  activo: boolean;
  fechaLimite: Date | null;
  createdAt: Date;
  totalPreguntas: number;
  yaRespondido: boolean;
  miCategoriaDominante: string | null;
}

@Injectable()
export class TestEstiloService {
  constructor(
    @InjectRepository(TestEstilo)
    private readonly tests: Repository<TestEstilo>,
    @InjectRepository(PreguntaEstilo)
    private readonly preguntas: Repository<PreguntaEstilo>,
    @InjectRepository(IntentoEstilo)
    private readonly intentos: Repository<IntentoEstilo>,
    private readonly coachees: CoacheesService,
    private readonly competencias: CompetenciasService,
    private readonly planesDesarrollo: PlanesDesarrolloService,
  ) {}

  private async assertCompetenciaExists(id: string): Promise<void> {
    if (!(await this.competencias.exists(id))) {
      throw new NotFoundException('Competencia no encontrada.');
    }
  }

  private async findOrThrow(id: string): Promise<TestEstilo> {
    const test = await this.tests.findOne({
      where: { id },
      relations: { competencia: true },
    });
    if (!test) {
      throw new NotFoundException('Test de estilo no encontrado.');
    }
    return test;
  }

  private async resolveCoacheeId(actorUserId: string): Promise<string> {
    const coachee = await this.coachees.findByUserId(actorUserId);
    if (!coachee) {
      throw new NotFoundException('Perfil de coachee no encontrado.');
    }
    return coachee.id;
  }

  // Mismo criterio que Quiz/Flashcards/Mapas/Ejercicios: el coachee solo ve tests de la
  // competencia que está trabajando ahora en su plan (o sin competencia = universal).
  private async resolvePlanCompetenciaId(
    coacheeId: string,
  ): Promise<string | null> {
    const plan = await this.planesDesarrollo
      .getByCoacheeId(coacheeId)
      .catch(() => null);
    return plan?.competenciaId ?? null;
  }

  async create(dto: CreateTestEstiloDto): Promise<TestEstilo> {
    if (dto.competenciaId) {
      await this.assertCompetenciaExists(dto.competenciaId);
    }
    return this.tests.save(
      this.tests.create({
        titulo: dto.titulo,
        descripcion: dto.descripcion ?? null,
        competenciaId: dto.competenciaId ?? null,
        fechaLimite: dto.fechaLimite
          ? finDelDiaChileAUtc(dto.fechaLimite)
          : null,
      }),
    );
  }

  findAll(): Promise<TestEstilo[]> {
    return this.tests.find({
      relations: { competencia: true },
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: string, dto: UpdateTestEstiloDto): Promise<TestEstilo> {
    const test = await this.findOrThrow(id);
    if (dto.competenciaId !== undefined) {
      await this.assertCompetenciaExists(dto.competenciaId);
    }
    const { fechaLimite, ...resto } = dto;
    assignDefined(test, resto as Partial<TestEstilo>);
    if (fechaLimite !== undefined) {
      test.fechaLimite = fechaLimite ? finDelDiaChileAUtc(fechaLimite) : null;
    }
    return this.tests.save(test);
  }

  async setActivo(id: string, activo: boolean): Promise<TestEstilo> {
    const test = await this.findOrThrow(id);
    test.activo = activo;
    return this.tests.save(test);
  }

  async remove(id: string): Promise<void> {
    await this.findOrThrow(id);
    const tieneIntentos = await this.intentos.exists({
      where: { testEstiloId: id },
    });
    if (tieneIntentos) {
      throw new ConflictException(
        'No se puede eliminar un test que ya tiene intentos registrados — desactívalo en su lugar.',
      );
    }
    await this.tests.delete({ id });
  }

  // Para el coach: incluye categoriaA/categoriaB. Igual que QuizService.findOneParaCoach,
  // se arma como objeto plano a propósito — el spread ignora el @Exclude() de la entidad.
  async findOneParaCoach(
    id: string,
  ): Promise<TestEstilo & { preguntas: PreguntaEstilo[] }> {
    const test = await this.findOrThrow(id);
    const preguntas = await this.preguntas.find({
      where: { testEstiloId: id },
      order: { orden: 'ASC' },
    });
    return { ...test, preguntas: preguntas.map((p) => ({ ...p })) };
  }

  // Para el coachee: nunca expone categoriaA/categoriaB (sesgaría la respuesta).
  async findOneParaCoachee(id: string): Promise<TestEstiloParaResponder> {
    const test = await this.findOrThrow(id);
    if (!test.activo) {
      throw new NotFoundException('Test de estilo no encontrado.');
    }
    const preguntas = await this.preguntas.find({
      where: { testEstiloId: id },
      order: { orden: 'ASC' },
    });
    return {
      id: test.id,
      titulo: test.titulo,
      descripcion: test.descripcion,
      competenciaId: test.competenciaId,
      preguntas: preguntas.map((p) => ({
        id: p.id,
        opcionA: p.opcionA,
        opcionB: p.opcionB,
        orden: p.orden,
      })),
    };
  }

  async addPregunta(
    testEstiloId: string,
    dto: CreatePreguntaEstiloDto,
  ): Promise<PreguntaEstilo> {
    await this.findOrThrow(testEstiloId);
    const orden =
      dto.orden ??
      (await this.preguntas.count({ where: { testEstiloId } })) + 1;
    const pregunta = await this.preguntas.save(
      this.preguntas.create({
        testEstiloId,
        opcionA: dto.opcionA,
        categoriaA: dto.categoriaA,
        opcionB: dto.opcionB,
        categoriaB: dto.categoriaB,
        orden,
      }),
    );
    return { ...pregunta };
  }

  async updatePregunta(
    preguntaId: string,
    dto: UpdatePreguntaEstiloDto,
  ): Promise<PreguntaEstilo> {
    const pregunta = await this.preguntas.findOne({
      where: { id: preguntaId },
    });
    if (!pregunta) {
      throw new NotFoundException('Pregunta no encontrada.');
    }
    assignDefined(pregunta, dto as Partial<PreguntaEstilo>);
    const saved = await this.preguntas.save(pregunta);
    return { ...saved };
  }

  async removePregunta(preguntaId: string): Promise<void> {
    const result = await this.preguntas.delete({ id: preguntaId });
    if (!result.affected) {
      throw new NotFoundException('Pregunta no encontrada.');
    }
  }

  async intentosDeTest(testEstiloId: string): Promise<IntentoEstilo[]> {
    await this.findOrThrow(testEstiloId);
    return this.intentos.find({
      where: { testEstiloId },
      relations: { coachee: true },
      order: { createdAt: 'DESC' },
    });
  }

  async disponiblesParaCoachee(
    actorUserId: string,
  ): Promise<TestEstiloResumen[]> {
    const coacheeId = await this.resolveCoacheeId(actorUserId);
    const competenciaId = await this.resolvePlanCompetenciaId(coacheeId);
    const tests = await this.tests.find({
      where: competenciaId
        ? [
            { activo: true, competenciaId },
            { activo: true, competenciaId: IsNull() },
          ]
        : { activo: true, competenciaId: IsNull() },
      relations: { competencia: true },
      order: { createdAt: 'DESC' },
    });
    const vigentes = tests.filter(
      (t) => !t.fechaLimite || t.fechaLimite.getTime() >= Date.now(),
    );
    return Promise.all(
      vigentes.map(async (test) => {
        const [totalPreguntas, misIntentos] = await Promise.all([
          this.preguntas.count({ where: { testEstiloId: test.id } }),
          this.intentos.find({
            where: { testEstiloId: test.id, coacheeId },
            order: { createdAt: 'DESC' },
          }),
        ]);
        return {
          id: test.id,
          titulo: test.titulo,
          descripcion: test.descripcion,
          competenciaId: test.competenciaId,
          competencia: test.competencia
            ? { id: test.competencia.id, nombre: test.competencia.nombre }
            : undefined,
          activo: test.activo,
          fechaLimite: test.fechaLimite,
          createdAt: test.createdAt,
          totalPreguntas,
          yaRespondido: misIntentos.length > 0,
          miCategoriaDominante: misIntentos[0]?.categoriaDominante ?? null,
        };
      }),
    );
  }

  async misIntentos(actorUserId: string): Promise<IntentoEstilo[]> {
    const coacheeId = await this.resolveCoacheeId(actorUserId);
    return this.intentos.find({
      where: { coacheeId },
      relations: { testEstilo: true },
      order: { createdAt: 'DESC' },
    });
  }

  async responder(
    actorUserId: string,
    testEstiloId: string,
    respuestas: ('A' | 'B')[],
  ): Promise<IntentoEstilo> {
    const coacheeId = await this.resolveCoacheeId(actorUserId);
    const test = await this.findOrThrow(testEstiloId);
    if (!test.activo) {
      throw new NotFoundException('Test de estilo no encontrado.');
    }
    const preguntas = await this.preguntas.find({
      where: { testEstiloId },
      order: { orden: 'ASC' },
    });
    if (respuestas.length !== preguntas.length) {
      throw new BadRequestException(
        `Se esperaban ${preguntas.length} respuestas, se recibieron ${respuestas.length}.`,
      );
    }

    const resultado: Record<string, number> = {};
    preguntas.forEach((pregunta, i) => {
      const categoria =
        respuestas[i] === 'A' ? pregunta.categoriaA : pregunta.categoriaB;
      resultado[categoria] = (resultado[categoria] ?? 0) + 1;
    });
    const maxConteo = Math.max(...Object.values(resultado));
    const categoriaDominante = Object.entries(resultado)
      .filter(([, conteo]) => conteo === maxConteo)
      .map(([categoria]) => categoria)
      .join(' / ');

    return this.intentos.save(
      this.intentos.create({
        testEstiloId,
        coacheeId,
        respuestas,
        resultado,
        categoriaDominante,
      }),
    );
  }
}
