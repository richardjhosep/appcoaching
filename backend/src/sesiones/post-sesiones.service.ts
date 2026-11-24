import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PostSesion } from './entities/post-sesion.entity';
import { Sesion } from './entities/sesion.entity';
import { UpdatePostSesionDto } from './dto/update-post-sesion.dto';
import { SesionesService } from './sesiones.service';
import { assignDefined } from '../common/assign-defined.util';

@Injectable()
export class PostSesionesService {
  constructor(
    @InjectRepository(PostSesion)
    private readonly postSesiones: Repository<PostSesion>,
    private readonly sesiones: SesionesService,
  ) {}

  private async findOrCreate(sesionId: string): Promise<PostSesion> {
    let postSesion = await this.postSesiones.findOne({ where: { sesionId } });
    if (!postSesion) {
      postSesion = await this.postSesiones.save(
        this.postSesiones.create({ sesionId }),
      );
    }
    return postSesion;
  }

  async findForSesion(sesionId: string): Promise<PostSesion | null> {
    return this.postSesiones.findOne({ where: { sesionId } });
  }

  /** Igual que `findForSesion` pero sin lo privado del coachee, para coach y empresa. */
  async findForSesionSinPrivados(
    sesionId: string,
  ): Promise<Omit<PostSesion, 'aprendizaje' | 'compromisos'> | null> {
    const postSesion = await this.findForSesion(sesionId);
    if (!postSesion) return null;
    const {
      aprendizaje: _aprendizaje,
      compromisos: _compromisos,
      ...resto
    } = postSesion;
    void _aprendizaje;
    void _compromisos;
    return resto;
  }

  private assertYaRealizada(sesion: Sesion): void {
    if (sesion.fechaHora.getTime() > Date.now()) {
      throw new BadRequestException(
        'El post-sesión solo puede completarse una vez realizada la sesión.',
      );
    }
  }

  async upsertOwn(
    actorUserId: string,
    sesionId: string,
    dto: UpdatePostSesionDto,
  ): Promise<PostSesion> {
    const sesion = await this.sesiones.findOneOwnedByCoachee(
      sesionId,
      await this.resolveCoacheeId(actorUserId),
    );
    this.assertYaRealizada(sesion);
    const postSesion = await this.findOrCreate(sesionId);
    if (postSesion.publicada) {
      throw new ForbiddenException(
        'El post-sesión ya fue publicado y no se puede editar.',
      );
    }
    assignDefined(postSesion, dto);
    return this.postSesiones.save(postSesion);
  }

  /** A diferencia del resto del post-sesión, los compromisos no se bloquean al publicar. */
  async guardarCompromisosOwn(
    actorUserId: string,
    sesionId: string,
    compromisos: string,
  ): Promise<PostSesion> {
    const sesion = await this.sesiones.findOneOwnedByCoachee(
      sesionId,
      await this.resolveCoacheeId(actorUserId),
    );
    this.assertYaRealizada(sesion);
    const postSesion = await this.findOrCreate(sesionId);
    postSesion.compromisos = compromisos.trim() || null;
    return this.postSesiones.save(postSesion);
  }

  async publicarOwn(
    actorUserId: string,
    sesionId: string,
  ): Promise<PostSesion> {
    const sesion = await this.sesiones.findOneOwnedByCoachee(
      sesionId,
      await this.resolveCoacheeId(actorUserId),
    );
    this.assertYaRealizada(sesion);
    const postSesion = await this.findOrCreate(sesionId);
    if (postSesion.publicada) {
      throw new ForbiddenException('El post-sesión ya fue publicado.');
    }
    // El aprendizaje es confidencial (solo lo ve el coachee), pero se exige para publicar.
    if (
      !postSesion.aprendizaje?.trim() ||
      !postSesion.utilidad ||
      !postSesion.cercaniaObjetivo
    ) {
      throw new BadRequestException(
        'Para publicar el post-sesión debes completar el aprendizaje, la utilidad y la cercanía al objetivo.',
      );
    }
    postSesion.publicada = true;
    return this.postSesiones.save(postSesion);
  }

  private async resolveCoacheeId(actorUserId: string): Promise<string> {
    return this.sesiones.resolveCoacheeIdForActor(actorUserId);
  }

  /**
   * `incluirAprendizaje` solo debe ser true cuando quien consulta es el propio coachee: el
   * aprendizaje es confidencial y no se entrega al coach ni a la empresa.
   */
  async findAllPublicadasForCoachee(
    coacheeId: string,
    incluirAprendizaje: boolean,
  ): Promise<
    Array<{
      sesionId: string;
      fecha: Date;
      cercaniaObjetivo: number;
      aprendizaje?: string | null;
    }>
  > {
    const rows = await this.postSesiones
      .createQueryBuilder('post')
      .innerJoinAndSelect('post.sesion', 'sesion')
      .where('sesion.coachee_id = :coacheeId', { coacheeId })
      .andWhere('post.publicada = true')
      .andWhere('post.cercania_objetivo IS NOT NULL')
      .andWhere('sesion.fecha_hora <= :now', { now: new Date() })
      .orderBy('sesion.fecha_hora', 'ASC')
      .getMany();

    return rows.map((r) => ({
      sesionId: r.sesionId,
      fecha: r.sesion!.fechaHora,
      cercaniaObjetivo: r.cercaniaObjetivo!,
      ...(incluirAprendizaje && { aprendizaje: r.aprendizaje }),
    }));
  }

  async avanceGeneral(coacheeId: string): Promise<number | null> {
    const ultima = await this.postSesiones
      .createQueryBuilder('post')
      .innerJoinAndSelect('post.sesion', 'sesion')
      .where('sesion.coachee_id = :coacheeId', { coacheeId })
      .andWhere('post.publicada = true')
      .andWhere('post.cercania_objetivo IS NOT NULL')
      .andWhere('sesion.fecha_hora <= :now', { now: new Date() })
      .orderBy('sesion.fecha_hora', 'DESC')
      .getOne();

    return ultima ? ultima.cercaniaObjetivo! * 10 : null;
  }
}
