import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, MoreThan, Repository } from 'typeorm';
import { Carpeta } from './entities/carpeta.entity';
import { AsignacionCarpeta } from './entities/asignacion-carpeta.entity';
import { CreateCarpetaDto } from './dto/create-carpeta.dto';
import { UpdateCarpetaDto } from './dto/update-carpeta.dto';
import { CoacheesService } from '../coachees/coachees.service';

@Injectable()
export class CarpetasService {
  constructor(
    @InjectRepository(Carpeta) private readonly carpetas: Repository<Carpeta>,
    @InjectRepository(AsignacionCarpeta)
    private readonly asignaciones: Repository<AsignacionCarpeta>,
    private readonly coachees: CoacheesService,
  ) {}

  async create(dto: CreateCarpetaDto): Promise<Carpeta> {
    if (dto.parentId) {
      await this.findOne(dto.parentId);
    }
    return this.carpetas.save(
      this.carpetas.create({
        nombre: dto.nombre,
        parentId: dto.parentId ?? null,
      }),
    );
  }

  findAll(): Promise<Carpeta[]> {
    return this.carpetas.find({ order: { nombre: 'ASC' } });
  }

  async findOne(id: string): Promise<Carpeta> {
    const carpeta = await this.carpetas.findOne({ where: { id } });
    if (!carpeta) {
      throw new NotFoundException('Carpeta not found');
    }
    return carpeta;
  }

  async update(id: string, dto: UpdateCarpetaDto): Promise<Carpeta> {
    const carpeta = await this.findOne(id);
    carpeta.nombre = dto.nombre;
    return this.carpetas.save(carpeta);
  }

  async setPublica(id: string, publica: boolean): Promise<Carpeta> {
    const carpeta = await this.findOne(id);
    carpeta.publica = publica;
    return this.carpetas.save(carpeta);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    const [{ total }] = await this.carpetas.manager.query<[{ total: number }]>(
      `SELECT (
        (SELECT COUNT(*) FROM carpetas WHERE parent_id = $1) +
        (SELECT COUNT(*) FROM recursos WHERE carpeta_id = $1)
      )::int AS total`,
      [id],
    );
    if (total > 0) {
      throw new ConflictException(
        'No se puede eliminar: la carpeta tiene subcarpetas o archivos adentro. Vacíala primero.',
      );
    }
    await this.carpetas.delete(id);
  }

  async asignar(
    carpetaId: string,
    coacheeId: string,
    activa: boolean,
    expiraEn: string | undefined,
  ): Promise<AsignacionCarpeta> {
    await this.findOne(carpetaId);
    if (!(await this.coachees.exists(coacheeId))) {
      throw new NotFoundException('Coachee not found');
    }
    let asignacion = await this.asignaciones.findOne({
      where: { carpetaId, coacheeId },
    });
    if (!asignacion) {
      asignacion = this.asignaciones.create({ carpetaId, coacheeId });
    }
    asignacion.activa = activa;
    asignacion.expiraEn = expiraEn ? new Date(expiraEn) : null;
    return this.asignaciones.save(asignacion);
  }

  async revocar(carpetaId: string, coacheeId: string): Promise<void> {
    await this.asignaciones.delete({ carpetaId, coacheeId });
  }

  asignacionesDeCarpeta(carpetaId: string): Promise<AsignacionCarpeta[]> {
    return this.asignaciones.find({
      where: { carpetaId, activa: true },
      relations: { coachee: { user: true } },
    });
  }

  /** Ids de carpeta visibles para un coachee: públicas + con acceso vigente otorgado. */
  async carpetasVisiblesIds(coacheeId: string): Promise<Set<string>> {
    const ahora = new Date();
    const [publicas, otorgadas] = await Promise.all([
      this.carpetas.find({ where: { publica: true } }),
      this.asignaciones.find({
        where: [
          { coacheeId, activa: true, expiraEn: IsNull() },
          { coacheeId, activa: true, expiraEn: MoreThan(ahora) },
        ],
      }),
    ]);
    return new Set([
      ...publicas.map((c) => c.id),
      ...otorgadas.map((a) => a.carpetaId),
    ]);
  }

  async carpetaVisible(carpetaId: string, coacheeId: string): Promise<boolean> {
    const carpeta = await this.findOne(carpetaId);
    if (carpeta.publica) return true;
    const ahora = new Date();
    const activa = await this.asignaciones.findOne({
      where: [
        { carpetaId, coacheeId, activa: true, expiraEn: IsNull() },
        { carpetaId, coacheeId, activa: true, expiraEn: MoreThan(ahora) },
      ],
    });
    return !!activa;
  }

  async misCarpetas(actorUserId: string): Promise<Carpeta[]> {
    const coachee = await this.coachees.findByUserId(actorUserId);
    if (!coachee) {
      throw new NotFoundException('Coachee profile not found');
    }
    const visiblesIds = await this.carpetasVisiblesIds(coachee.id);
    if (visiblesIds.size === 0) return [];
    const todas = await this.findAll();
    return todas.filter((c) => visiblesIds.has(c.id));
  }
}
