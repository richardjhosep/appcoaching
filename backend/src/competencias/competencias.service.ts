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
    // INSERT ... ON CONFLICT (nombre) DO UPDATE: a diferencia del DO NOTHING anterior, esto
    // mantiene `definicion`/`niveles` sincronizados con el código cada vez que se enriquece el
    // seed (ej. agregar `comportamientos` a un nivel) — sin eso, cada enriquecimiento del
    // catálogo necesitaría además una migración de datos manual fila por fila. Sigue siendo
    // atómico a nivel de base de datos, seguro ante instancias arrancando en paralelo.
    await this.competencias
      .createQueryBuilder()
      .insert()
      .into(Competencia)
      .values(COMPETENCIAS_SEED)
      .orUpdate(['definicion', 'niveles'], ['nombre'])
      .execute();

    this.logger.log(
      `Synced ${COMPETENCIAS_SEED.length} competencias from the master catalog.`,
    );
  }

  findAll(): Promise<Competencia[]> {
    return this.competencias.find({ order: { nombre: 'ASC' } });
  }

  async findById(id: string): Promise<Competencia> {
    const competencia = await this.competencias.findOne({ where: { id } });
    if (!competencia) {
      throw new NotFoundException('Competencia no encontrada.');
    }
    return competencia;
  }

  exists(id: string): Promise<boolean> {
    return this.competencias.exists({ where: { id } });
  }
}
