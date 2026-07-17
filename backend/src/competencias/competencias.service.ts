import {
  Injectable,
  Logger,
  NotFoundException,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Competencia } from './entities/competencia.entity';
import { COMPETENCIAS_SEED } from './competencias.seed-data';

@Injectable()
export class CompetenciasService implements OnApplicationBootstrap {
  private readonly logger = new Logger(CompetenciasService.name);

  constructor(
    @InjectRepository(Competencia)
    private readonly competencias: Repository<Competencia>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    // INSERT ... ON CONFLICT DO NOTHING: seguro ante instancias que arrancan en paralelo
    // contra la misma base (a diferencia de un count()-then-insert, que no es atómico).
    const result = await this.competencias
      .createQueryBuilder()
      .insert()
      .into(Competencia)
      .values(COMPETENCIAS_SEED)
      .orIgnore()
      .execute();

    const inserted = result.identifiers.filter((id) => id?.id).length;
    if (inserted > 0) {
      this.logger.log(
        `Seeded ${inserted} competencias from the master catalog.`,
      );
    }
  }

  findAll(): Promise<Competencia[]> {
    return this.competencias.find({ order: { nombre: 'ASC' } });
  }

  async findById(id: string): Promise<Competencia> {
    const competencia = await this.competencias.findOne({ where: { id } });
    if (!competencia) {
      throw new NotFoundException('Competencia not found');
    }
    return competencia;
  }

  exists(id: string): Promise<boolean> {
    return this.competencias.exists({ where: { id } });
  }
}
