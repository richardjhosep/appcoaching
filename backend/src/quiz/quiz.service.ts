import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Quiz } from './entities/quiz.entity';
import { PreguntaQuiz } from './entities/pregunta-quiz.entity';
import { IntentoQuiz } from './entities/intento-quiz.entity';
import { Recurso } from '../recursos/entities/recurso.entity';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { CreatePreguntaDto } from './dto/create-pregunta.dto';
import { UpdatePreguntaDto } from './dto/update-pregunta.dto';
import { CoacheesService } from '../coachees/coachees.service';
import { CompetenciasService } from '../competencias/competencias.service';
import { PlanesDesarrolloService } from '../planes-desarrollo/planes-desarrollo.service';
import { assignDefined } from '../common/assign-defined.util';
import { finDelDiaChileAUtc } from '../common/chile-time.util';

export interface PreguntaParaResponder {
  id: string;
  enunciado: string;
  opciones: string[];
  orden: number;
}

export interface QuizParaResponder {
  id: string;
  titulo: string;
  competenciaId: string;
  recursoId: string | null;
  preguntas: PreguntaParaResponder[];
}

export interface QuizResumen {
  id: string;
  titulo: string;
  competenciaId: string;
  recursoId: string | null;
  activo: boolean;
  fechaLimite: Date | null;
  createdAt: Date;
  competencia?: { id: string; nombre: string };
  totalPreguntas: number;
  mejorPuntaje: number | null;
}

export interface ResultadoIntento {
  puntaje: number;
  totalPreguntas: number;
  detalle: {
    preguntaId: string;
    correcta: boolean;
    respuestaCorrecta: number;
  }[];
}

@Injectable()
export class QuizService {
  constructor(
    @InjectRepository(Quiz) private readonly quizzes: Repository<Quiz>,
    @InjectRepository(PreguntaQuiz)
    private readonly preguntas: Repository<PreguntaQuiz>,
    @InjectRepository(IntentoQuiz)
    private readonly intentos: Repository<IntentoQuiz>,
    @InjectRepository(Recurso) private readonly recursos: Repository<Recurso>,
    private readonly coachees: CoacheesService,
    private readonly competencias: CompetenciasService,
    private readonly planesDesarrollo: PlanesDesarrolloService,
  ) {}

  private async assertCompetenciaExists(id: string): Promise<void> {
    if (!(await this.competencias.exists(id))) {
      throw new NotFoundException('Competencia no encontrada.');
    }
  }

  private async assertRecursoExists(id: string): Promise<void> {
    if (!(await this.recursos.exists({ where: { id } }))) {
      throw new NotFoundException('Recurso no encontrado.');
    }
  }

  private async findOrThrow(id: string): Promise<Quiz> {
    const quiz = await this.quizzes.findOne({
      where: { id },
      relations: { competencia: true, recurso: true },
    });
    if (!quiz) {
      throw new NotFoundException('Quiz no encontrado.');
    }
    return quiz;
  }

  private async resolveCoacheeId(actorUserId: string): Promise<string> {
    const coachee = await this.coachees.findByUserId(actorUserId);
    if (!coachee) {
      throw new NotFoundException('Perfil de coachee no encontrado.');
    }
    return coachee.id;
  }

  // Mismo criterio que lib/formacionRecomendada.ts en el frontend: el coachee solo ve
  // contenido de estudio de la competencia que está trabajando ahora mismo en su plan —
  // sin esto, cualquier coachee veía TODO el catálogo activo sin importar el tópico.
  private async resolvePlanCompetenciaId(
    coacheeId: string,
  ): Promise<string | null> {
    const plan = await this.planesDesarrollo
      .getByCoacheeId(coacheeId)
      .catch(() => null);
    return plan?.competenciaId ?? null;
  }

  async create(dto: CreateQuizDto): Promise<Quiz> {
    await this.assertCompetenciaExists(dto.competenciaId);
    if (dto.recursoId) {
      await this.assertRecursoExists(dto.recursoId);
    }
    return this.quizzes.save(
      this.quizzes.create({
        titulo: dto.titulo,
        competenciaId: dto.competenciaId,
        recursoId: dto.recursoId ?? null,
        fechaLimite: dto.fechaLimite
          ? finDelDiaChileAUtc(dto.fechaLimite)
          : null,
      }),
    );
  }

  findAll(): Promise<Quiz[]> {
    return this.quizzes.find({
      relations: { competencia: true, recurso: true },
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: string, dto: UpdateQuizDto): Promise<Quiz> {
    const quiz = await this.findOrThrow(id);
    if (dto.competenciaId !== undefined) {
      await this.assertCompetenciaExists(dto.competenciaId);
    }
    if (dto.recursoId !== undefined) {
      await this.assertRecursoExists(dto.recursoId);
    }
    const { fechaLimite, ...resto } = dto;
    assignDefined(quiz, resto as Partial<Quiz>);
    if (fechaLimite !== undefined) {
      quiz.fechaLimite = fechaLimite ? finDelDiaChileAUtc(fechaLimite) : null;
    }
    return this.quizzes.save(quiz);
  }

  async setActivo(id: string, activo: boolean): Promise<Quiz> {
    const quiz = await this.findOrThrow(id);
    quiz.activo = activo;
    return this.quizzes.save(quiz);
  }

  async remove(id: string): Promise<void> {
    await this.findOrThrow(id);
    const tieneIntentos = await this.intentos.exists({ where: { quizId: id } });
    if (tieneIntentos) {
      throw new ConflictException(
        'No se puede eliminar un quiz que ya tiene intentos registrados — desactívalo en su lugar.',
      );
    }
    await this.quizzes.delete({ id });
  }

  // Para el coach: incluye respuestaCorrecta. Se arma como objeto plano
  // (`{...pregunta}`) a propósito — el spread ignora el @Exclude() de la
  // entidad, que solo protege el camino "para coachee" de abajo.
  async findOneParaCoach(
    id: string,
  ): Promise<Quiz & { preguntas: PreguntaQuiz[] }> {
    const quiz = await this.findOrThrow(id);
    const preguntas = await this.preguntas.find({
      where: { quizId: id },
      order: { orden: 'ASC' },
    });
    return { ...quiz, preguntas: preguntas.map((p) => ({ ...p })) };
  }

  // Para el coachee: construido campo por campo, sin pasar nunca
  // respuestaCorrecta por el tipo de retorno — no depende de que el
  // serializador global recorra bien el array anidado, es explícito.
  async findOneParaCoachee(id: string): Promise<QuizParaResponder> {
    const quiz = await this.findOrThrow(id);
    if (!quiz.activo) {
      throw new NotFoundException('Quiz no encontrado.');
    }
    const preguntas = await this.preguntas.find({
      where: { quizId: id },
      order: { orden: 'ASC' },
    });
    return {
      id: quiz.id,
      titulo: quiz.titulo,
      competenciaId: quiz.competenciaId,
      recursoId: quiz.recursoId,
      preguntas: preguntas.map((p) => ({
        id: p.id,
        enunciado: p.enunciado,
        opciones: p.opciones,
        orden: p.orden,
      })),
    };
  }

  async addPregunta(
    quizId: string,
    dto: CreatePreguntaDto,
  ): Promise<PreguntaQuiz> {
    await this.findOrThrow(quizId);
    if (dto.respuestaCorrecta >= dto.opciones.length) {
      throw new BadRequestException(
        'respuestaCorrecta debe ser un índice válido dentro de opciones.',
      );
    }
    const orden =
      dto.orden ?? (await this.preguntas.count({ where: { quizId } })) + 1;
    const pregunta = await this.preguntas.save(
      this.preguntas.create({
        quizId,
        enunciado: dto.enunciado,
        opciones: dto.opciones,
        respuestaCorrecta: dto.respuestaCorrecta,
        orden,
      }),
    );
    return { ...pregunta };
  }

  async updatePregunta(
    preguntaId: string,
    dto: UpdatePreguntaDto,
  ): Promise<PreguntaQuiz> {
    const pregunta = await this.preguntas.findOne({
      where: { id: preguntaId },
    });
    if (!pregunta) {
      throw new NotFoundException('Pregunta no encontrada.');
    }
    const opciones = dto.opciones ?? pregunta.opciones;
    const respuestaCorrecta =
      dto.respuestaCorrecta ?? pregunta.respuestaCorrecta;
    if (respuestaCorrecta >= opciones.length) {
      throw new BadRequestException(
        'respuestaCorrecta debe ser un índice válido dentro de opciones.',
      );
    }
    assignDefined(pregunta, dto as Partial<PreguntaQuiz>);
    const saved = await this.preguntas.save(pregunta);
    return { ...saved };
  }

  async removePregunta(preguntaId: string): Promise<void> {
    const result = await this.preguntas.delete({ id: preguntaId });
    if (!result.affected) {
      throw new NotFoundException('Pregunta no encontrada.');
    }
  }

  async intentosDeQuiz(quizId: string): Promise<IntentoQuiz[]> {
    await this.findOrThrow(quizId);
    return this.intentos.find({
      where: { quizId },
      relations: { coachee: true },
      order: { createdAt: 'DESC' },
    });
  }

  async disponiblesParaCoachee(actorUserId: string): Promise<QuizResumen[]> {
    const coacheeId = await this.resolveCoacheeId(actorUserId);
    const competenciaId = await this.resolvePlanCompetenciaId(coacheeId);
    if (!competenciaId) return [];
    const quizzes = await this.quizzes.find({
      where: { activo: true, competenciaId },
      relations: { competencia: true },
      order: { createdAt: 'DESC' },
    });
    const vigentes = quizzes.filter(
      (q) => !q.fechaLimite || q.fechaLimite.getTime() >= Date.now(),
    );
    return Promise.all(
      vigentes.map(async (quiz) => {
        const [totalPreguntas, misIntentos] = await Promise.all([
          this.preguntas.count({ where: { quizId: quiz.id } }),
          this.intentos.find({ where: { quizId: quiz.id, coacheeId } }),
        ]);
        const mejorPuntaje = misIntentos.length
          ? Math.max(...misIntentos.map((i) => i.puntaje))
          : null;
        return {
          id: quiz.id,
          titulo: quiz.titulo,
          competenciaId: quiz.competenciaId,
          recursoId: quiz.recursoId,
          activo: quiz.activo,
          fechaLimite: quiz.fechaLimite,
          createdAt: quiz.createdAt,
          competencia: quiz.competencia
            ? { id: quiz.competencia.id, nombre: quiz.competencia.nombre }
            : undefined,
          totalPreguntas,
          mejorPuntaje,
        };
      }),
    );
  }

  async misIntentos(actorUserId: string): Promise<IntentoQuiz[]> {
    const coacheeId = await this.resolveCoacheeId(actorUserId);
    return this.intentos.find({
      where: { coacheeId },
      relations: { quiz: true },
      order: { createdAt: 'DESC' },
    });
  }

  async responder(
    actorUserId: string,
    quizId: string,
    respuestas: number[],
  ): Promise<ResultadoIntento> {
    const coacheeId = await this.resolveCoacheeId(actorUserId);
    const quiz = await this.findOrThrow(quizId);
    if (!quiz.activo) {
      throw new NotFoundException('Quiz no encontrado.');
    }
    const preguntas = await this.preguntas.find({
      where: { quizId },
      order: { orden: 'ASC' },
    });
    if (respuestas.length !== preguntas.length) {
      throw new BadRequestException(
        `Se esperaban ${preguntas.length} respuestas, se recibieron ${respuestas.length}.`,
      );
    }

    const detalle = preguntas.map((pregunta, i) => ({
      preguntaId: pregunta.id,
      correcta: respuestas[i] === pregunta.respuestaCorrecta,
      respuestaCorrecta: pregunta.respuestaCorrecta,
    }));
    const puntaje = detalle.filter((d) => d.correcta).length;

    await this.intentos.save(
      this.intentos.create({
        quizId,
        coacheeId,
        respuestas,
        puntaje,
        totalPreguntas: preguntas.length,
      }),
    );

    return { puntaje, totalPreguntas: preguntas.length, detalle };
  }
}
