import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Logro } from './entities/logro.entity';
import { EntradaDiario } from './entities/entrada-diario.entity';
import { AutoevaluacionCompetencia } from './entities/autoevaluacion-competencia.entity';
import { CreateLogroDto } from './dto/create-logro.dto';
import { CreateEntradaDiarioDto } from './dto/create-entrada-diario.dto';
import { CreateAutoevaluacionDto } from './dto/create-autoevaluacion.dto';
import { CoacheesService } from '../coachees/coachees.service';
import { PostSesionesService } from '../sesiones/post-sesiones.service';
import { CompetenciasService } from '../competencias/competencias.service';

@Injectable()
export class SeguimientoService {
  constructor(
    @InjectRepository(Logro) private readonly logros: Repository<Logro>,
    @InjectRepository(EntradaDiario)
    private readonly diarios: Repository<EntradaDiario>,
    @InjectRepository(AutoevaluacionCompetencia)
    private readonly autoevaluaciones: Repository<AutoevaluacionCompetencia>,
    private readonly coachees: CoacheesService,
    private readonly postSesiones: PostSesionesService,
    private readonly competencias: CompetenciasService,
  ) {}

  private async resolveCoacheeId(actorUserId: string): Promise<string> {
    const coachee = await this.coachees.findByUserId(actorUserId);
    if (!coachee) {
      throw new NotFoundException('Perfil de coachee no encontrado.');
    }
    return coachee.id;
  }

  async addLogroOwn(actorUserId: string, dto: CreateLogroDto): Promise<Logro> {
    const coacheeId = await this.resolveCoacheeId(actorUserId);
    return this.logros.save(
      this.logros.create({
        coacheeId,
        fecha: dto.fecha,
        situacion: dto.situacion ?? null,
        descripcion: dto.descripcion,
      }),
    );
  }

  async listLogrosOwn(actorUserId: string): Promise<Logro[]> {
    const coacheeId = await this.resolveCoacheeId(actorUserId);
    return this.listLogrosForCoachee(coacheeId);
  }

  listLogrosForCoachee(coacheeId: string): Promise<Logro[]> {
    return this.logros.find({
      where: { coacheeId },
      order: { createdAt: 'DESC' },
    });
  }

  async removeLogroOwn(actorUserId: string, logroId: string): Promise<void> {
    const coacheeId = await this.resolveCoacheeId(actorUserId);
    const result = await this.logros.delete({ id: logroId, coacheeId });
    if (!result.affected) {
      throw new NotFoundException('Logro no encontrado.');
    }
  }

  async addEntradaDiarioOwn(
    actorUserId: string,
    dto: CreateEntradaDiarioDto,
  ): Promise<EntradaDiario> {
    const coacheeId = await this.resolveCoacheeId(actorUserId);
    return this.diarios.save(
      this.diarios.create({ coacheeId, contenido: dto.contenido }),
    );
  }

  async listEntradasDiarioOwn(actorUserId: string): Promise<EntradaDiario[]> {
    const coacheeId = await this.resolveCoacheeId(actorUserId);
    return this.diarios.find({
      where: { coacheeId },
      order: { createdAt: 'DESC' },
    });
  }

  async avanceGeneralOwn(actorUserId: string): Promise<number | null> {
    const coacheeId = await this.resolveCoacheeId(actorUserId);
    return this.postSesiones.avanceGeneral(coacheeId);
  }

  avanceGeneralForCoachee(coacheeId: string): Promise<number | null> {
    return this.postSesiones.avanceGeneral(coacheeId);
  }

  async lineaProgresoOwn(actorUserId: string) {
    const coacheeId = await this.resolveCoacheeId(actorUserId);
    return this.postSesiones.findAllPublicadasForCoachee(coacheeId);
  }

  lineaProgresoForCoachee(coacheeId: string) {
    return this.postSesiones.findAllPublicadasForCoachee(coacheeId);
  }

  async addAutoevaluacionOwn(
    actorUserId: string,
    dto: CreateAutoevaluacionDto,
  ): Promise<AutoevaluacionCompetencia> {
    const coacheeId = await this.resolveCoacheeId(actorUserId);
    if (!(await this.competencias.exists(dto.competenciaId))) {
      throw new NotFoundException('Competencia no encontrada.');
    }
    return this.autoevaluaciones.save(
      this.autoevaluaciones.create({
        coacheeId,
        competenciaId: dto.competenciaId,
        nivel: dto.nivel,
        ejemplo: dto.ejemplo,
      }),
    );
  }

  async listAutoevaluacionesOwn(
    actorUserId: string,
  ): Promise<AutoevaluacionCompetencia[]> {
    const coacheeId = await this.resolveCoacheeId(actorUserId);
    return this.listAutoevaluacionesForCoachee(coacheeId);
  }

  listAutoevaluacionesForCoachee(
    coacheeId: string,
  ): Promise<AutoevaluacionCompetencia[]> {
    return this.autoevaluaciones.find({
      where: { coacheeId },
      order: { createdAt: 'DESC' },
    });
  }
}
