import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { ParametroConfiguracion } from './entities/parametro-configuracion.entity';
import { CreateParametroDto } from './dto/create-parametro.dto';
import { UpdateParametroDto } from './dto/update-parametro.dto';
import { PARAMETROS_SEED } from './configuracion.seed-data';
import { assignDefined } from '../common/assign-defined.util';

export interface PreguntaRetroalimentacion {
  bloque: string;
  afirmacion: string;
}

const GRUPO_BLOQUES_RETROALIMENTACION = 'RETROALIMENTACION_BLOQUES';
const GRUPO_SATISFACCION_CATEGORIAS = 'SATISFACCION_CATEGORIAS';

@Injectable()
export class ConfiguracionService implements OnApplicationBootstrap {
  private readonly logger = new Logger(ConfiguracionService.name);

  constructor(
    @InjectRepository(ParametroConfiguracion)
    private readonly parametros: Repository<ParametroConfiguracion>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    // orIgnore (ON CONFLICT DO NOTHING): a diferencia del sync de competencias, acá la base
    // manda una vez creado el dato — el coach lo edita desde la UI y un futuro cambio del seed
    // en código nunca debe pisarle la edición.
    await this.parametros
      .createQueryBuilder()
      .insert()
      .into(ParametroConfiguracion)
      .values(PARAMETROS_SEED)
      .orIgnore()
      .execute();

    this.logger.log(
      `Verificados ${PARAMETROS_SEED.length} parámetros del catálogo inicial.`,
    );
  }

  listar(grupo?: string): Promise<ParametroConfiguracion[]> {
    return this.parametros.find({
      where: grupo ? { grupo } : {},
      order: { grupo: 'ASC', clave: 'ASC' },
    });
  }

  private async listarActivosPorGrupo(
    grupo: string,
  ): Promise<ParametroConfiguracion[]> {
    return this.parametros.find({
      where: { grupo, estado: true },
      order: { clave: 'ASC' },
    });
  }

  /**
   * Arma el catálogo de preguntas de retroalimentación de cierre desde la parametrización —
   * mismo shape {bloque, afirmacion}[] que antes servía el archivo hardcodeado, para no tocar
   * a los consumidores más de lo necesario.
   */
  async listarPreguntasRetroalimentacion(): Promise<
    PreguntaRetroalimentacion[]
  > {
    const bloques = await this.listarActivosPorGrupo(
      GRUPO_BLOQUES_RETROALIMENTACION,
    );
    const preguntasPorBloque = await Promise.all(
      bloques.map((b) => this.listarActivosPorGrupo(b.valor)),
    );
    return bloques.flatMap((bloque, i) =>
      preguntasPorBloque[i].map((p) => ({
        bloque: bloque.valor,
        afirmacion: p.valor,
      })),
    );
  }

  /**
   * Categorías de la encuesta de satisfacción (empresa, por ciclo cerrado) — lista plana desde
   * la parametrización, sin el nivel de índice de bloques que sí necesita retroalimentación.
   */
  async listarCategoriasSatisfaccion(): Promise<string[]> {
    const categorias = await this.listarActivosPorGrupo(
      GRUPO_SATISFACCION_CATEGORIAS,
    );
    return categorias.map((c) => c.valor);
  }

  async crear(dto: CreateParametroDto): Promise<ParametroConfiguracion> {
    try {
      return await this.parametros.save(this.parametros.create(dto));
    } catch (err) {
      if (err instanceof QueryFailedError) {
        throw new ConflictException(
          'Ya existe un parámetro con ese grupo y clave.',
        );
      }
      throw err;
    }
  }

  async actualizar(
    id: string,
    dto: UpdateParametroDto,
  ): Promise<ParametroConfiguracion> {
    const parametro = await this.parametros.findOne({ where: { id } });
    if (!parametro) {
      throw new NotFoundException('Parámetro no encontrado.');
    }
    assignDefined(parametro, dto);
    try {
      return await this.parametros.save(parametro);
    } catch (err) {
      if (err instanceof QueryFailedError) {
        throw new ConflictException(
          'Ya existe un parámetro con ese grupo y clave.',
        );
      }
      throw err;
    }
  }

  async eliminar(id: string): Promise<void> {
    const parametro = await this.parametros.findOne({ where: { id } });
    if (!parametro) {
      throw new NotFoundException('Parámetro no encontrado.');
    }
    await this.parametros.remove(parametro);
  }
}
