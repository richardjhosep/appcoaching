import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, MoreThan, Repository } from 'typeorm';
import { Recurso } from './entities/recurso.entity';
import { AsignacionRecurso } from './entities/asignacion-recurso.entity';
import { CreateRecursoDto } from './dto/create-recurso.dto';
import { UpdateRecursoDto } from './dto/update-recurso.dto';
import { TipoRecurso } from './enums/tipo-recurso.enum';
import { CoacheesService } from '../coachees/coachees.service';
import { CarpetasService } from './carpetas.service';
import { assignDefined } from '../common/assign-defined.util';

@Injectable()
export class RecursosService {
  constructor(
    @InjectRepository(Recurso) private readonly recursos: Repository<Recurso>,
    @InjectRepository(AsignacionRecurso)
    private readonly asignaciones: Repository<AsignacionRecurso>,
    private readonly coachees: CoacheesService,
    private readonly carpetas: CarpetasService,
  ) {}

  async create(
    dto: CreateRecursoDto,
    archivo?: { originalname: string; filename: string },
  ): Promise<Recurso> {
    if (dto.tipo === TipoRecurso.LINK && !dto.url) {
      throw new BadRequestException(
        'Un recurso de tipo link requiere una url.',
      );
    }
    if (dto.tipo === TipoRecurso.ARCHIVO && !archivo) {
      throw new BadRequestException(
        'Un recurso de tipo archivo requiere un archivo.',
      );
    }
    await this.carpetas.findOne(dto.carpetaId);
    return this.recursos.save(
      this.recursos.create({
        titulo: dto.titulo,
        descripcion: dto.descripcion ?? null,
        carpetaId: dto.carpetaId,
        tipo: dto.tipo,
        url: dto.tipo === TipoRecurso.LINK ? dto.url! : null,
        archivoNombre: archivo?.originalname ?? null,
        archivoPath: archivo?.filename ?? null,
      }),
    );
  }

  findAll(carpetaId?: string, search?: string): Promise<Recurso[]> {
    const query = this.recursos
      .createQueryBuilder('recurso')
      .orderBy('recurso.created_at', 'DESC');
    if (carpetaId) {
      query.andWhere('recurso.carpeta_id = :carpetaId', { carpetaId });
    }
    if (search) {
      query.andWhere('recurso.titulo ILIKE :search', { search: `%${search}%` });
    }
    return query.getMany();
  }

  async findOne(id: string): Promise<Recurso> {
    const recurso = await this.recursos.findOne({ where: { id } });
    if (!recurso) {
      throw new NotFoundException('Recurso not found');
    }
    return recurso;
  }

  async update(id: string, dto: UpdateRecursoDto): Promise<Recurso> {
    const recurso = await this.findOne(id);
    if (dto.carpetaId) {
      await this.carpetas.findOne(dto.carpetaId);
    }
    assignDefined(recurso, {
      titulo: dto.titulo,
      descripcion: dto.descripcion,
      carpetaId: dto.carpetaId,
    });
    return this.recursos.save(recurso);
  }

  async remove(id: string): Promise<void> {
    const result = await this.recursos.delete(id);
    if (!result.affected) {
      throw new NotFoundException('Recurso not found');
    }
  }

  async assignForCoachee(
    recursoId: string,
    coacheeId: string,
    activa: boolean,
    expiraEn: string | undefined,
  ): Promise<AsignacionRecurso> {
    await this.findOne(recursoId);
    if (!(await this.coachees.exists(coacheeId))) {
      throw new NotFoundException('Coachee not found');
    }
    let asignacion = await this.asignaciones.findOne({
      where: { recursoId, coacheeId },
    });
    if (!asignacion) {
      asignacion = this.asignaciones.create({ recursoId, coacheeId });
    }
    asignacion.activa = activa;
    asignacion.expiraEn = expiraEn ? new Date(expiraEn) : null;
    return this.asignaciones.save(asignacion);
  }

  private async resolveCoacheeId(actorUserId: string): Promise<string> {
    const coachee = await this.coachees.findByUserId(actorUserId);
    if (!coachee) {
      throw new NotFoundException('Coachee profile not found');
    }
    return coachee.id;
  }

  /**
   * Un recurso es visible para un coachee si su carpeta es pública o le
   * otorgaron acceso a la carpeta, o si le compartieron el recurso puntual
   * (sin necesidad de abrir toda la carpeta) — en ambos casos el acceso
   * puede tener vencimiento.
   */
  async misRecursos(actorUserId: string): Promise<Recurso[]> {
    const coacheeId = await this.resolveCoacheeId(actorUserId);
    const ahora = new Date();
    const [carpetasVisibles, asignacionesDirectas] = await Promise.all([
      this.carpetas.carpetasVisiblesIds(coacheeId),
      this.asignaciones.find({
        where: [
          { coacheeId, activa: true, expiraEn: IsNull() },
          { coacheeId, activa: true, expiraEn: MoreThan(ahora) },
        ],
      }),
    ]);
    const recursoIdsDirectos = new Set(
      asignacionesDirectas.map((a) => a.recursoId),
    );
    if (carpetasVisibles.size === 0 && recursoIdsDirectos.size === 0) return [];

    const todos = await this.recursos.find({ order: { createdAt: 'DESC' } });
    return todos.filter(
      (r) => carpetasVisibles.has(r.carpetaId) || recursoIdsDirectos.has(r.id),
    );
  }

  async asignacionesDeRecurso(recursoId: string): Promise<AsignacionRecurso[]> {
    return this.asignaciones.find({ where: { recursoId, activa: true } });
  }

  /** Verifica visibilidad y devuelve el coacheeId, para que el llamador no tenga que resolverlo dos veces. */
  async assertEnBibliotecaDeCoachee(
    actorUserId: string,
    recursoId: string,
  ): Promise<string> {
    const coacheeId = await this.resolveCoacheeId(actorUserId);
    const recurso = await this.findOne(recursoId);
    const ahora = new Date();

    const [carpetaVisible, asignacionDirecta] = await Promise.all([
      this.carpetas.carpetaVisible(recurso.carpetaId, coacheeId),
      this.asignaciones.findOne({
        where: [
          { recursoId, coacheeId, activa: true, expiraEn: IsNull() },
          { recursoId, coacheeId, activa: true, expiraEn: MoreThan(ahora) },
        ],
      }),
    ]);

    if (!carpetaVisible && !asignacionDirecta) {
      throw new ForbiddenException('Este recurso no está en tu biblioteca.');
    }
    return coacheeId;
  }

  async assertCoacheePuedeDescargar(
    actorUserId: string,
    recursoId: string,
  ): Promise<void> {
    await this.assertEnBibliotecaDeCoachee(actorUserId, recursoId);
  }
}
