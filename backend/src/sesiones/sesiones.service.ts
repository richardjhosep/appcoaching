import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, MoreThan, Repository } from 'typeorm';
import { Sesion } from './entities/sesion.entity';
import { CicloCoaching } from '../ciclos/entities/ciclo-coaching.entity';
import { CreateSesionDto } from './dto/create-sesion.dto';
import { UpdateSesionDto } from './dto/update-sesion.dto';
import { CoacheesService } from '../coachees/coachees.service';

export type SesionSinNotasPrivadas = Omit<Sesion, 'notasPrivadas'>;

@Injectable()
export class SesionesService {
  constructor(
    @InjectRepository(Sesion) private readonly sesiones: Repository<Sesion>,
    @InjectRepository(CicloCoaching)
    private readonly ciclos: Repository<CicloCoaching>,
    private readonly coachees: CoacheesService,
  ) {}

  private stripPrivateNotes(sesion: Sesion): SesionSinNotasPrivadas {
    const rest: Partial<Sesion> = { ...sesion };
    delete rest.notasPrivadas;
    return rest as SesionSinNotasPrivadas;
  }

  async create(dto: CreateSesionDto): Promise<Sesion> {
    if (!(await this.coachees.exists(dto.coacheeId))) {
      throw new NotFoundException('Coachee not found');
    }
    // La sesión queda vinculada al ciclo abierto del coachee (si existe), para que
    // el conteo de "sesiones restantes" y el informe final del ciclo sean exactos.
    const cicloAbierto = await this.ciclos.findOne({
      where: { coacheeId: dto.coacheeId, fechaCierre: IsNull() },
    });
    return this.sesiones.save(
      this.sesiones.create({
        coacheeId: dto.coacheeId,
        cicloId: cicloAbierto?.id ?? null,
        fechaHora: new Date(dto.fechaHora),
        linkVideollamada: dto.linkVideollamada ?? null,
      }),
    );
  }

  findAllForCoach(coacheeId?: string): Promise<Sesion[]> {
    return this.sesiones.find({
      where: coacheeId ? { coacheeId } : {},
      order: { fechaHora: 'ASC' },
    });
  }

  async findOneFull(id: string): Promise<Sesion> {
    const sesion = await this.sesiones.findOne({ where: { id } });
    if (!sesion) {
      throw new NotFoundException('Sesión not found');
    }
    return sesion;
  }

  async findOneOwnedByCoachee(
    sesionId: string,
    coacheeId: string,
  ): Promise<Sesion> {
    const sesion = await this.sesiones.findOne({
      where: { id: sesionId, coacheeId },
    });
    if (!sesion) {
      throw new NotFoundException('Sesión not found');
    }
    return sesion;
  }

  async resolveCoacheeIdForActor(actorUserId: string): Promise<string> {
    const coachee = await this.coachees.findByUserId(actorUserId);
    if (!coachee) {
      throw new NotFoundException('Coachee profile not found');
    }
    return coachee.id;
  }

  async findAllForCoachee(
    actorUserId: string,
  ): Promise<SesionSinNotasPrivadas[]> {
    const coachee = await this.coachees.findByUserId(actorUserId);
    if (!coachee) {
      throw new NotFoundException('Coachee profile not found');
    }
    const sesiones = await this.sesiones.find({
      where: { coacheeId: coachee.id },
      order: { fechaHora: 'ASC' },
    });
    return sesiones.map((s) => this.stripPrivateNotes(s));
  }

  async findProximaForCoachee(
    actorUserId: string,
  ): Promise<SesionSinNotasPrivadas | null> {
    const coachee = await this.coachees.findByUserId(actorUserId);
    if (!coachee) {
      throw new NotFoundException('Coachee profile not found');
    }
    const proxima = await this.sesiones.findOne({
      where: { coacheeId: coachee.id, fechaHora: MoreThan(new Date()) },
      order: { fechaHora: 'ASC' },
    });
    return proxima ? this.stripPrivateNotes(proxima) : null;
  }

  async update(id: string, dto: UpdateSesionDto): Promise<Sesion> {
    const sesion = await this.findOneFull(id);
    if (dto.fechaHora !== undefined) {
      sesion.fechaHora = new Date(dto.fechaHora);
    }
    if (dto.linkVideollamada !== undefined) {
      sesion.linkVideollamada = dto.linkVideollamada;
    }
    if (dto.resumenCompartido !== undefined) {
      sesion.resumenCompartido = dto.resumenCompartido;
    }
    if (dto.notasPrivadas !== undefined) {
      sesion.notasPrivadas = dto.notasPrivadas;
    }
    if (dto.asistio !== undefined) {
      sesion.asistio = dto.asistio;
    }
    return this.sesiones.save(sesion);
  }

  async remove(id: string): Promise<void> {
    const result = await this.sesiones.delete(id);
    if (!result.affected) {
      throw new NotFoundException('Sesión not found');
    }
  }
}
