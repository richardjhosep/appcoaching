import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Recurso } from './entities/recurso.entity';
import { AsignacionRecurso } from './entities/asignacion-recurso.entity';
import { CreateRecursoDto } from './dto/create-recurso.dto';
import { UpdateRecursoDto } from './dto/update-recurso.dto';
import { TipoRecurso } from './enums/tipo-recurso.enum';
import { OrigenAsignacion } from './enums/origen-asignacion.enum';
import { CoacheesService } from '../coachees/coachees.service';
import { assignDefined } from '../common/assign-defined.util';

function parseEtiquetas(etiquetas?: string): string[] | null {
  if (!etiquetas) return null;
  const parsed = etiquetas
    .split(',')
    .map((e) => e.trim())
    .filter((e) => e.length > 0);
  return parsed.length > 0 ? parsed : null;
}

@Injectable()
export class RecursosService {
  constructor(
    @InjectRepository(Recurso) private readonly recursos: Repository<Recurso>,
    @InjectRepository(AsignacionRecurso)
    private readonly asignaciones: Repository<AsignacionRecurso>,
    private readonly coachees: CoacheesService,
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
    return this.recursos.save(
      this.recursos.create({
        titulo: dto.titulo,
        descripcion: dto.descripcion ?? null,
        etiquetas: parseEtiquetas(dto.etiquetas),
        tipo: dto.tipo,
        url: dto.tipo === TipoRecurso.LINK ? dto.url! : null,
        archivoNombre: archivo?.originalname ?? null,
        archivoPath: archivo?.filename ?? null,
      }),
    );
  }

  findAll(search?: string, etiqueta?: string): Promise<Recurso[]> {
    const query = this.recursos
      .createQueryBuilder('recurso')
      .orderBy('recurso.created_at', 'DESC');
    if (search) {
      query.andWhere('recurso.titulo ILIKE :search', { search: `%${search}%` });
    }
    if (etiqueta) {
      // simple-array se guarda como texto separado por comas; ILIKE sobre el valor
      // crudo alcanza para el MVP sin necesitar una tabla de etiquetas aparte.
      query.andWhere('recurso.etiquetas ILIKE :etiqueta', {
        etiqueta: `%${etiqueta}%`,
      });
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
    assignDefined(recurso, {
      titulo: dto.titulo,
      descripcion: dto.descripcion,
      etiquetas:
        dto.etiquetas !== undefined ? parseEtiquetas(dto.etiquetas) : undefined,
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
  ): Promise<AsignacionRecurso> {
    await this.findOne(recursoId);
    if (!(await this.coachees.exists(coacheeId))) {
      throw new NotFoundException('Coachee not found');
    }
    let asignacion = await this.asignaciones.findOne({
      where: { recursoId, coacheeId },
    });
    if (!asignacion) {
      asignacion = this.asignaciones.create({
        recursoId,
        coacheeId,
        origen: OrigenAsignacion.COACH,
      });
    }
    asignacion.activa = activa;
    return this.asignaciones.save(asignacion);
  }

  private async resolveCoacheeId(actorUserId: string): Promise<string> {
    const coachee = await this.coachees.findByUserId(actorUserId);
    if (!coachee) {
      throw new NotFoundException('Coachee profile not found');
    }
    return coachee.id;
  }

  async autoasignar(
    actorUserId: string,
    recursoId: string,
  ): Promise<AsignacionRecurso> {
    await this.findOne(recursoId);
    const coacheeId = await this.resolveCoacheeId(actorUserId);
    let asignacion = await this.asignaciones.findOne({
      where: { recursoId, coacheeId },
    });
    if (!asignacion) {
      asignacion = this.asignaciones.create({
        recursoId,
        coacheeId,
        origen: OrigenAsignacion.AUTOASIGNADO,
      });
    }
    asignacion.activa = true;
    return this.asignaciones.save(asignacion);
  }

  async quitarAutoasignacion(
    actorUserId: string,
    recursoId: string,
  ): Promise<void> {
    const coacheeId = await this.resolveCoacheeId(actorUserId);
    const asignacion = await this.asignaciones.findOne({
      where: { recursoId, coacheeId },
    });
    if (!asignacion || !asignacion.activa) {
      throw new NotFoundException('Asignación not found');
    }
    if (asignacion.origen !== OrigenAsignacion.AUTOASIGNADO) {
      throw new ForbiddenException(
        'Este recurso fue asignado por tu coach; solo tu coach puede quitarlo.',
      );
    }
    asignacion.activa = false;
    await this.asignaciones.save(asignacion);
  }

  async misRecursos(actorUserId: string): Promise<Recurso[]> {
    const coacheeId = await this.resolveCoacheeId(actorUserId);
    const asignaciones = await this.asignaciones.find({
      where: { coacheeId, activa: true },
    });
    if (asignaciones.length === 0) return [];
    return this.recursos.find({
      where: { id: In(asignaciones.map((a) => a.recursoId)) },
      order: { createdAt: 'DESC' },
    });
  }

  async asignacionesDeRecurso(recursoId: string): Promise<AsignacionRecurso[]> {
    return this.asignaciones.find({ where: { recursoId, activa: true } });
  }

  async assertEnBibliotecaDeCoachee(
    actorUserId: string,
    recursoId: string,
  ): Promise<string> {
    const coacheeId = await this.resolveCoacheeId(actorUserId);
    const asignacion = await this.asignaciones.findOne({
      where: { recursoId, coacheeId, activa: true },
    });
    if (!asignacion) {
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
