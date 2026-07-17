import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Logro } from './entities/logro.entity';
import { EntradaDiario } from './entities/entrada-diario.entity';
import { CreateLogroDto } from './dto/create-logro.dto';
import { CoacheesService } from '../coachees/coachees.service';
import { PostSesionesService } from '../sesiones/post-sesiones.service';

@Injectable()
export class SeguimientoService {
  constructor(
    @InjectRepository(Logro) private readonly logros: Repository<Logro>,
    @InjectRepository(EntradaDiario)
    private readonly diarios: Repository<EntradaDiario>,
    private readonly coachees: CoacheesService,
    private readonly postSesiones: PostSesionesService,
  ) {}

  private async resolveCoacheeId(actorUserId: string): Promise<string> {
    const coachee = await this.coachees.findByUserId(actorUserId);
    if (!coachee) {
      throw new NotFoundException('Coachee profile not found');
    }
    return coachee.id;
  }

  async addLogroOwn(actorUserId: string, dto: CreateLogroDto): Promise<Logro> {
    const coacheeId = await this.resolveCoacheeId(actorUserId);
    return this.logros.save(
      this.logros.create({
        coacheeId,
        fecha: dto.fecha,
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
      throw new NotFoundException('Logro not found');
    }
  }

  private async findOrCreateDiario(coacheeId: string): Promise<EntradaDiario> {
    let diario = await this.diarios.findOne({ where: { coacheeId } });
    if (!diario) {
      diario = await this.diarios.save(this.diarios.create({ coacheeId }));
    }
    return diario;
  }

  async getDiarioOwn(actorUserId: string): Promise<EntradaDiario> {
    const coacheeId = await this.resolveCoacheeId(actorUserId);
    return this.findOrCreateDiario(coacheeId);
  }

  async updateDiarioOwn(
    actorUserId: string,
    contenido: string,
  ): Promise<EntradaDiario> {
    const coacheeId = await this.resolveCoacheeId(actorUserId);
    const diario = await this.findOrCreateDiario(coacheeId);
    diario.contenido = contenido;
    return this.diarios.save(diario);
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
}
