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
    if (
      !postSesion.aprendizaje ||
      !postSesion.utilidad ||
      !postSesion.cercaniaObjetivo
    ) {
      throw new BadRequestException(
        'Para publicar el post-sesión debes completar aprendizaje, utilidad y cercanía al objetivo.',
      );
    }
    postSesion.publicada = true;
    return this.postSesiones.save(postSesion);
  }

  private async resolveCoacheeId(actorUserId: string): Promise<string> {
    return this.sesiones.resolveCoacheeIdForActor(actorUserId);
  }

  async findAllPublicadasForCoachee(
    coacheeId: string,
  ): Promise<
    Array<{ sesionId: string; fecha: Date; cercaniaObjetivo: number }>
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
