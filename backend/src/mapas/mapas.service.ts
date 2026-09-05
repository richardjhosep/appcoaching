import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { MapaMental } from './entities/mapa-mental.entity';
import { NodoMapa } from './entities/nodo-mapa.entity';
import { Recurso } from '../recursos/entities/recurso.entity';
import { CreateMapaDto } from './dto/create-mapa.dto';
import { UpdateMapaDto } from './dto/update-mapa.dto';
import { CreateNodoDto } from './dto/create-nodo.dto';
import { UpdateNodoDto } from './dto/update-nodo.dto';
import { CompetenciasService } from '../competencias/competencias.service';
import { CoacheesService } from '../coachees/coachees.service';
import { PlanesDesarrolloService } from '../planes-desarrollo/planes-desarrollo.service';
import { assignDefined } from '../common/assign-defined.util';
import { finDelDiaChileAUtc } from '../common/chile-time.util';

export interface MapaResumen {
  id: string;
  titulo: string;
  competenciaId: string;
  competencia?: { id: string; nombre: string };
  recursoId: string | null;
  activo: boolean;
  fechaLimite: Date | null;
  createdAt: Date;
  totalNodos: number;
}

@Injectable()
export class MapasService {
  constructor(
    @InjectRepository(MapaMental)
    private readonly mapas: Repository<MapaMental>,
    @InjectRepository(NodoMapa) private readonly nodos: Repository<NodoMapa>,
    @InjectRepository(Recurso) private readonly recursos: Repository<Recurso>,
    private readonly competencias: CompetenciasService,
    private readonly coachees: CoacheesService,
    private readonly planesDesarrollo: PlanesDesarrolloService,
  ) {}

  private async resolveCoacheeId(actorUserId: string): Promise<string> {
    const coachee = await this.coachees.findByUserId(actorUserId);
    if (!coachee) {
      throw new NotFoundException('Perfil de coachee no encontrado.');
    }
    return coachee.id;
  }

  // Mismo criterio que lib/formacionRecomendada.ts en el frontend — ver quiz.service.ts.
  private async resolvePlanCompetenciaId(
    coacheeId: string,
  ): Promise<string | null> {
    const plan = await this.planesDesarrollo
      .getByCoacheeId(coacheeId)
      .catch(() => null);
    return plan?.competenciaId ?? null;
  }

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

  private async findOrThrow(id: string): Promise<MapaMental> {
    const mapa = await this.mapas.findOne({
      where: { id },
      relations: { competencia: true, recurso: true },
    });
    if (!mapa) {
      throw new NotFoundException('Mapa no encontrado.');
    }
    return mapa;
  }

  private async assertNodoBelongsToMapa(
    nodoId: string,
    mapaId: string,
  ): Promise<void> {
    const exists = await this.nodos.exists({ where: { id: nodoId, mapaId } });
    if (!exists) {
      throw new NotFoundException('Nodo no encontrado en este mapa.');
    }
  }

  async create(dto: CreateMapaDto): Promise<MapaMental> {
    await this.assertCompetenciaExists(dto.competenciaId);
    if (dto.recursoId) {
      await this.assertRecursoExists(dto.recursoId);
    }
    return this.mapas.save(
      this.mapas.create({
        titulo: dto.titulo,
        competenciaId: dto.competenciaId,
        recursoId: dto.recursoId ?? null,
        fechaLimite: dto.fechaLimite
          ? finDelDiaChileAUtc(dto.fechaLimite)
          : null,
      }),
    );
  }

  findAll(): Promise<MapaMental[]> {
    return this.mapas.find({
      relations: { competencia: true, recurso: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findOneConNodos(
    id: string,
  ): Promise<MapaMental & { nodos: NodoMapa[] }> {
    const mapa = await this.findOrThrow(id);
    const nodos = await this.nodos.find({
      where: { mapaId: id },
      order: { orden: 'ASC' },
    });
    return { ...mapa, nodos };
  }

  async update(id: string, dto: UpdateMapaDto): Promise<MapaMental> {
    const mapa = await this.findOrThrow(id);
    if (dto.competenciaId !== undefined) {
      await this.assertCompetenciaExists(dto.competenciaId);
    }
    if (dto.recursoId !== undefined) {
      await this.assertRecursoExists(dto.recursoId);
    }
    const { fechaLimite, ...resto } = dto;
    assignDefined(mapa, resto as Partial<MapaMental>);
    if (fechaLimite !== undefined) {
      mapa.fechaLimite = fechaLimite ? finDelDiaChileAUtc(fechaLimite) : null;
    }
    return this.mapas.save(mapa);
  }

  async setActivo(id: string, activo: boolean): Promise<MapaMental> {
    const mapa = await this.findOrThrow(id);
    mapa.activo = activo;
    return this.mapas.save(mapa);
  }

  async remove(id: string): Promise<void> {
    await this.findOrThrow(id);
    // Sin guard de "tiene historial" — a diferencia de Quiz/Flashcards no hay
    // ningún dato del coachee atado a un mapa (es exploración, no se registra
    // nada). El borrado de nodos hijos al borrar un nodo padre sí es cascada
    // real (ver nodo-mapa.entity.ts), con aviso previo en el frontend.
    await this.mapas.delete({ id });
  }

  async addNodo(mapaId: string, dto: CreateNodoDto): Promise<NodoMapa> {
    await this.findOrThrow(mapaId);
    if (dto.parentId) {
      await this.assertNodoBelongsToMapa(dto.parentId, mapaId);
    }
    const orden =
      dto.orden ??
      (await this.nodos.count({
        where: { mapaId, parentId: dto.parentId ?? IsNull() },
      })) + 1;
    return this.nodos.save(
      this.nodos.create({
        mapaId,
        label: dto.label,
        detalle: dto.detalle ?? null,
        parentId: dto.parentId ?? null,
        orden,
      }),
    );
  }

  async updateNodo(nodoId: string, dto: UpdateNodoDto): Promise<NodoMapa> {
    const nodo = await this.nodos.findOne({ where: { id: nodoId } });
    if (!nodo) {
      throw new NotFoundException('Nodo no encontrado.');
    }
    if (dto.parentId !== undefined && dto.parentId !== null) {
      if (dto.parentId === nodoId) {
        throw new BadRequestException('Un nodo no puede ser su propio padre.');
      }
      await this.assertNodoBelongsToMapa(dto.parentId, nodo.mapaId);
    }
    assignDefined(nodo, dto as Partial<NodoMapa>);
    return this.nodos.save(nodo);
  }

  async removeNodo(nodoId: string): Promise<void> {
    const result = await this.nodos.delete({ id: nodoId });
    if (!result.affected) {
      throw new NotFoundException('Nodo no encontrado.');
    }
  }

  async disponiblesParaCoachee(actorUserId: string): Promise<MapaResumen[]> {
    const coacheeId = await this.resolveCoacheeId(actorUserId);
    const competenciaId = await this.resolvePlanCompetenciaId(coacheeId);
    if (!competenciaId) return [];
    const mapas = await this.mapas.find({
      where: { activo: true, competenciaId },
      relations: { competencia: true },
      order: { createdAt: 'DESC' },
    });
    const vigentes = mapas.filter(
      (m) => !m.fechaLimite || m.fechaLimite.getTime() >= Date.now(),
    );
    return Promise.all(
      vigentes.map(async (mapa) => {
        const totalNodos = await this.nodos.count({
          where: { mapaId: mapa.id },
        });
        return {
          id: mapa.id,
          titulo: mapa.titulo,
          competenciaId: mapa.competenciaId,
          competencia: mapa.competencia
            ? { id: mapa.competencia.id, nombre: mapa.competencia.nombre }
            : undefined,
          recursoId: mapa.recursoId,
          activo: mapa.activo,
          fechaLimite: mapa.fechaLimite,
          createdAt: mapa.createdAt,
          totalNodos,
        };
      }),
    );
  }
}
