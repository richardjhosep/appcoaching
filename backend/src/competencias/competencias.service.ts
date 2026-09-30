import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Competencia } from './entities/competencia.entity';
import { COMPETENCIAS_SEED } from './competencias.seed-data';
import { CreateCompetenciaEmpresaDto } from './dto/create-competencia-empresa.dto';
import { UpdateCompetenciaEmpresaDto } from './dto/update-competencia-empresa.dto';

// Código de error de Postgres para "violación de llave foránea" — ver
// removeForEmpresa(): red de seguridad para relaciones que no se chequean a mano acá
// (flashcards/mapas/quizzes también referencian competencia_id sin ON DELETE).
const FK_VIOLATION = '23503';

@Injectable()
export class CompetenciasService implements OnApplicationBootstrap {
  private readonly logger = new Logger(CompetenciasService.name);

  constructor(
    @InjectRepository(Competencia)
    private readonly competencias: Repository<Competencia>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    // INSERT ... ON CONFLICT (nombre) WHERE empresa_id IS NULL DO UPDATE: el índice único
    // de "nombre" ahora es parcial (solo entre las filas globales, ver migración
    // CompetenciasPorEmpresa) — sin el indexPredicate acá, Postgres no encuentra a qué
    // restricción apunta el ON CONFLICT y falla. Mantiene definicion/niveles sincronizados
    // con el código cada vez que se enriquece el seed, sin tocar jamás las competencias que
    // una empresa haya creado por su cuenta (empresa_id no nulo).
    await this.competencias
      .createQueryBuilder()
      .insert()
      .into(Competencia)
      .values(COMPETENCIAS_SEED)
      .orUpdate(['definicion', 'niveles'], ['nombre'], {
        indexPredicate: '"empresa_id" IS NULL',
      })
      .execute();

    this.logger.log(
      `Synced ${COMPETENCIAS_SEED.length} competencias from the master catalog.`,
    );
  }

  // Catálogo global únicamente — el endpoint GET /competencias es de acceso abierto a
  // cualquier usuario autenticado, así que nunca puede filtrar en las competencias propias
  // de OTRA empresa. Ver findVisibleFor() para el caso "global + la empresa de este coachee".
  findAll(): Promise<Competencia[]> {
    return this.competencias.find({
      where: { empresaId: IsNull() },
      order: { nombre: 'ASC' },
    });
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

  /** ¿Puede este coachee/empresa usar esta competencia? Global, o propia de su empresa. */
  async existsVisibleFor(
    id: string,
    empresaId: string | null,
  ): Promise<boolean> {
    const competencia = await this.competencias.findOne({ where: { id } });
    if (!competencia) return false;
    return (
      competencia.empresaId === null ||
      (empresaId !== null && competencia.empresaId === empresaId)
    );
  }

  /** Catálogo global + el propio de una empresa — lo que ve el coach al asignarle una
   * competencia a un coachee de esa empresa (o solo el global, si es independiente). */
  async findVisibleFor(empresaId: string | null): Promise<Competencia[]> {
    const globales = await this.competencias.find({
      where: { empresaId: IsNull() },
    });
    if (!empresaId)
      return globales.sort((a, b) => a.nombre.localeCompare(b.nombre));
    const propias = await this.competencias.find({ where: { empresaId } });
    return [...globales, ...propias].sort((a, b) =>
      a.nombre.localeCompare(b.nombre),
    );
  }

  findAllForEmpresa(empresaId: string): Promise<Competencia[]> {
    return this.competencias.find({
      where: { empresaId },
      order: { nombre: 'ASC' },
    });
  }

  createForEmpresa(
    empresaId: string,
    dto: CreateCompetenciaEmpresaDto,
  ): Promise<Competencia> {
    return this.competencias.save(
      this.competencias.create({
        empresaId,
        nombre: dto.nombre,
        definicion: dto.definicion,
        niveles: dto.niveles,
      }),
    );
  }

  private async findOwnedByEmpresa(
    empresaId: string,
    id: string,
  ): Promise<Competencia> {
    const competencia = await this.competencias.findOne({ where: { id } });
    // 404 en vez de 403 a propósito: no delatar que existe una competencia de otra empresa.
    if (!competencia || competencia.empresaId !== empresaId) {
      throw new NotFoundException('Competencia no encontrada.');
    }
    return competencia;
  }

  async updateForEmpresa(
    empresaId: string,
    id: string,
    dto: UpdateCompetenciaEmpresaDto,
  ): Promise<Competencia> {
    const competencia = await this.findOwnedByEmpresa(empresaId, id);
    if (dto.nombre !== undefined) competencia.nombre = dto.nombre;
    if (dto.definicion !== undefined) competencia.definicion = dto.definicion;
    if (dto.niveles !== undefined) competencia.niveles = dto.niveles;
    return this.competencias.save(competencia);
  }

  async removeForEmpresa(empresaId: string, id: string): Promise<void> {
    await this.findOwnedByEmpresa(empresaId, id);
    try {
      await this.competencias.delete({ id, empresaId });
    } catch (err) {
      // 23503: algún coachee tiene esta competencia en su plan de desarrollo (u otro
      // contenido del coach la referencia) — no se chequea cada tabla una por una, se deja
      // que la base de datos sea la fuente de verdad y se traduce el error a algo legible.
      if ((err as { code?: string }).code === FK_VIOLATION) {
        throw new ConflictException(
          'No se puede eliminar: esta competencia está en uso (en un plan de desarrollo u otro contenido).',
        );
      }
      throw err;
    }
  }
}
