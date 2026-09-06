import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { MapaPersonal } from './entities/mapa-personal.entity';
import { NodoMapaPersonal } from './entities/nodo-mapa-personal.entity';
import { CreateMapaPersonalDto } from './dto/create-mapa-personal.dto';
import { UpdateMapaPersonalDto } from './dto/update-mapa-personal.dto';
import { CreateNodoPersonalDto } from './dto/create-nodo-personal.dto';
import { UpdateNodoPersonalDto } from './dto/update-nodo-personal.dto';
import { CoacheesService } from '../coachees/coachees.service';
import { assignDefined } from '../common/assign-defined.util';

@Injectable()
export class MapasPersonalesService {
  constructor(
    @InjectRepository(MapaPersonal)
    private readonly mapas: Repository<MapaPersonal>,
    @InjectRepository(NodoMapaPersonal)
    private readonly nodos: Repository<NodoMapaPersonal>,
    private readonly coachees: CoacheesService,
  ) {}

  // Todo lo que entra a este servicio pasa por acá primero — nunca se confía en un
  // coacheeId del body/param, siempre se resuelve desde el JWT del actor.
  private async resolveCoacheeId(actorUserId: string): Promise<string> {
    const coachee = await this.coachees.findByUserId(actorUserId);
    if (!coachee) {
      throw new NotFoundException('Perfil de coachee no encontrado.');
    }
    return coachee.id;
  }

  // Nunca revela si el mapa existe pero es de otro coachee — mismo NotFoundException en
  // ambos casos, para no filtrar existencia de mapas ajenos.
  private async findMapaOwned(
    mapaId: string,
    coacheeId: string,
  ): Promise<MapaPersonal> {
    const mapa = await this.mapas.findOne({
      where: { id: mapaId, coacheeId },
    });
    if (!mapa) {
      throw new NotFoundException('Mapa no encontrado.');
    }
    return mapa;
  }

  private async findNodoOwned(
    nodoId: string,
    coacheeId: string,
  ): Promise<NodoMapaPersonal> {
    const nodo = await this.nodos.findOne({
      where: { id: nodoId },
      relations: { mapa: true },
    });
    if (!nodo || nodo.mapa?.coacheeId !== coacheeId) {
      throw new NotFoundException('Nodo no encontrado.');
    }
    return nodo;
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

  async create(
    actorUserId: string,
    dto: CreateMapaPersonalDto,
  ): Promise<MapaPersonal> {
    const coacheeId = await this.resolveCoacheeId(actorUserId);
    return this.mapas.save(
      this.mapas.create({ coacheeId, titulo: dto.titulo }),
    );
  }

  async findAllDeCoachee(actorUserId: string): Promise<MapaPersonal[]> {
    const coacheeId = await this.resolveCoacheeId(actorUserId);
    return this.mapas.find({
      where: { coacheeId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOneConNodos(
    actorUserId: string,
    mapaId: string,
  ): Promise<MapaPersonal & { nodos: NodoMapaPersonal[] }> {
    const coacheeId = await this.resolveCoacheeId(actorUserId);
    const mapa = await this.findMapaOwned(mapaId, coacheeId);
    const nodos = await this.nodos.find({
      where: { mapaId },
      order: { orden: 'ASC' },
    });
    return { ...mapa, nodos };
  }

  async update(
    actorUserId: string,
    mapaId: string,
    dto: UpdateMapaPersonalDto,
  ): Promise<MapaPersonal> {
    const coacheeId = await this.resolveCoacheeId(actorUserId);
    const mapa = await this.findMapaOwned(mapaId, coacheeId);
    assignDefined(mapa, dto);
    return this.mapas.save(mapa);
  }

  async remove(actorUserId: string, mapaId: string): Promise<void> {
    const coacheeId = await this.resolveCoacheeId(actorUserId);
    await this.findMapaOwned(mapaId, coacheeId);
    await this.mapas.delete({ id: mapaId });
  }

  async addNodo(
    actorUserId: string,
    mapaId: string,
    dto: CreateNodoPersonalDto,
  ): Promise<NodoMapaPersonal> {
    const coacheeId = await this.resolveCoacheeId(actorUserId);
    await this.findMapaOwned(mapaId, coacheeId);
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

  async updateNodo(
    actorUserId: string,
    nodoId: string,
    dto: UpdateNodoPersonalDto,
  ): Promise<NodoMapaPersonal> {
    const coacheeId = await this.resolveCoacheeId(actorUserId);
    const nodo = await this.findNodoOwned(nodoId, coacheeId);
    if (dto.parentId !== undefined && dto.parentId !== null) {
      if (dto.parentId === nodoId) {
        throw new BadRequestException('Un nodo no puede ser su propio padre.');
      }
      await this.assertNodoBelongsToMapa(dto.parentId, nodo.mapaId);
    }
    assignDefined(nodo, dto);
    return this.nodos.save(nodo);
  }

  async removeNodo(actorUserId: string, nodoId: string): Promise<void> {
    const coacheeId = await this.resolveCoacheeId(actorUserId);
    await this.findNodoOwned(nodoId, coacheeId);
    await this.nodos.delete({ id: nodoId });
  }
}
