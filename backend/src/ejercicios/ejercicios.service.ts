import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ejercicio } from './entities/ejercicio.entity';
import { VersionEjercicio } from './entities/version-ejercicio.entity';
import { CreateEjercicioDto } from './dto/create-ejercicio.dto';
import { UpdateEjercicioDto } from './dto/update-ejercicio.dto';
import { CreateVersionDto } from './dto/create-version.dto';
import { CoacheesService } from '../coachees/coachees.service';
import { CompetenciasService } from '../competencias/competencias.service';
import { EstadoVersionEjercicio } from './enums/estado-version-ejercicio.enum';
import { assignDefined } from '../common/assign-defined.util';

export interface EjercicioResumen {
  id: string;
  titulo: string;
  consigna: string;
  competenciaId: string | null;
  activo: boolean;
  createdAt: Date;
  competencia?: { id: string; nombre: string };
  numeroVersiones: number;
  ultimoEstado: EstadoVersionEjercicio | null;
}

@Injectable()
export class EjerciciosService {
  constructor(
    @InjectRepository(Ejercicio)
    private readonly ejercicios: Repository<Ejercicio>,
    @InjectRepository(VersionEjercicio)
    private readonly versiones: Repository<VersionEjercicio>,
    private readonly coachees: CoacheesService,
    private readonly competencias: CompetenciasService,
  ) {}

  private async assertCompetenciaExists(id: string): Promise<void> {
    if (!(await this.competencias.exists(id))) {
      throw new NotFoundException('Competencia not found');
    }
  }

  private async findOrThrow(id: string): Promise<Ejercicio> {
    const ejercicio = await this.ejercicios.findOne({
      where: { id },
      relations: { competencia: true },
    });
    if (!ejercicio) {
      throw new NotFoundException('Ejercicio not found');
    }
    return ejercicio;
  }

  private async resolveCoacheeId(actorUserId: string): Promise<string> {
    const coachee = await this.coachees.findByUserId(actorUserId);
    if (!coachee) {
      throw new NotFoundException('Coachee profile not found');
    }
    return coachee.id;
  }

  async create(dto: CreateEjercicioDto): Promise<Ejercicio> {
    if (dto.competenciaId) {
      await this.assertCompetenciaExists(dto.competenciaId);
    }
    return this.ejercicios.save(
      this.ejercicios.create({
        titulo: dto.titulo,
        consigna: dto.consigna,
        competenciaId: dto.competenciaId ?? null,
      }),
    );
  }

  findAll(): Promise<Ejercicio[]> {
    return this.ejercicios.find({
      relations: { competencia: true },
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: string, dto: UpdateEjercicioDto): Promise<Ejercicio> {
    const ejercicio = await this.findOrThrow(id);
    if (dto.competenciaId !== undefined) {
      await this.assertCompetenciaExists(dto.competenciaId);
    }
    assignDefined(ejercicio, dto as Partial<Ejercicio>);
    return this.ejercicios.save(ejercicio);
  }

  async setActivo(id: string, activo: boolean): Promise<Ejercicio> {
    const ejercicio = await this.findOrThrow(id);
    ejercicio.activo = activo;
    return this.ejercicios.save(ejercicio);
  }

  async remove(id: string): Promise<void> {
    await this.findOrThrow(id);
    const tieneVersiones = await this.versiones.exists({
      where: { ejercicioId: id },
    });
    if (tieneVersiones) {
      throw new ConflictException(
        'No se puede eliminar un ejercicio que ya tiene versiones registradas — desactívalo en su lugar.',
      );
    }
    await this.ejercicios.delete({ id });
  }

  async findOneParaCoach(
    id: string,
  ): Promise<Ejercicio & { versiones: VersionEjercicio[] }> {
    const ejercicio = await this.findOrThrow(id);
    const versiones = await this.versiones.find({
      where: { ejercicioId: id },
      relations: { coachee: true },
      order: { createdAt: 'DESC' },
    });
    return { ...ejercicio, versiones };
  }

  async findOneParaCoachee(id: string): Promise<Ejercicio> {
    const ejercicio = await this.findOrThrow(id);
    if (!ejercicio.activo) {
      throw new NotFoundException('Ejercicio not found');
    }
    return ejercicio;
  }

  async disponiblesParaCoachee(
    actorUserId: string,
  ): Promise<EjercicioResumen[]> {
    const coacheeId = await this.resolveCoacheeId(actorUserId);
    const ejercicios = await this.ejercicios.find({
      where: { activo: true },
      relations: { competencia: true },
      order: { createdAt: 'DESC' },
    });
    return Promise.all(
      ejercicios.map(async (ejercicio) => {
        const misVersiones = await this.versiones.find({
          where: { ejercicioId: ejercicio.id, coacheeId },
          order: { numeroVersion: 'DESC' },
        });
        return {
          id: ejercicio.id,
          titulo: ejercicio.titulo,
          consigna: ejercicio.consigna,
          competenciaId: ejercicio.competenciaId,
          activo: ejercicio.activo,
          createdAt: ejercicio.createdAt,
          competencia: ejercicio.competencia
            ? {
                id: ejercicio.competencia.id,
                nombre: ejercicio.competencia.nombre,
              }
            : undefined,
          numeroVersiones: misVersiones.length,
          ultimoEstado: misVersiones[0]?.estado ?? null,
        };
      }),
    );
  }

  async misVersiones(
    actorUserId: string,
    ejercicioId: string,
  ): Promise<VersionEjercicio[]> {
    const coacheeId = await this.resolveCoacheeId(actorUserId);
    await this.findOrThrow(ejercicioId);
    return this.versiones.find({
      where: { ejercicioId, coacheeId },
      order: { numeroVersion: 'ASC' },
    });
  }

  async crearVersion(
    actorUserId: string,
    ejercicioId: string,
    dto: CreateVersionDto,
  ): Promise<VersionEjercicio> {
    const coacheeId = await this.resolveCoacheeId(actorUserId);
    const ejercicio = await this.findOrThrow(ejercicioId);
    if (!ejercicio.activo) {
      throw new NotFoundException('Ejercicio not found');
    }
    const numeroVersion =
      (await this.versiones.count({ where: { ejercicioId, coacheeId } })) + 1;
    return this.versiones.save(
      this.versiones.create({
        ejercicioId,
        coacheeId,
        numeroVersion,
        sabe: dto.sabe,
        siente: dto.siente,
        haga: dto.haga,
        estado: EstadoVersionEjercicio.ENVIADA,
      }),
    );
  }

  async dejarFeedback(
    versionId: string,
    comentarioCoach: string,
  ): Promise<VersionEjercicio> {
    const version = await this.versiones.findOne({ where: { id: versionId } });
    if (!version) {
      throw new NotFoundException('Versión not found');
    }
    version.comentarioCoach = comentarioCoach;
    version.estado = EstadoVersionEjercicio.CON_FEEDBACK;
    return this.versiones.save(version);
  }
}
