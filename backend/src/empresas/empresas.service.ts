import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Empresa } from './entities/empresa.entity';
import { GestionRenovacion } from './entities/gestion-renovacion.entity';
import { EmpresaCompetencia } from './entities/empresa-competencia.entity';
import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { UpdateEmpresaDto } from './dto/update-empresa.dto';
import { CreateGestionDto } from './dto/create-gestion.dto';
import { assignDefined } from '../common/assign-defined.util';
import { SESION_DURACION_MINUTOS } from '../sesiones/sesiones.constants';

// Lo que devuelven los endpoints de empresa: la entidad + las horas contratadas que realmente
// rigen (manual si `horasFijas`, si no la suma de sesiones de los ciclos de sus coachees).
export type EmpresaConHoras = Empresa & {
  horasContratadasEfectivas: number | null;
};

@Injectable()
export class EmpresasService {
  constructor(
    @InjectRepository(Empresa) private readonly empresas: Repository<Empresa>,
    @InjectRepository(GestionRenovacion)
    private readonly gestiones: Repository<GestionRenovacion>,
    @InjectRepository(EmpresaCompetencia)
    private readonly empresaCompetencias: Repository<EmpresaCompetencia>,
  ) {}

  async create(dto: CreateEmpresaDto): Promise<Empresa> {
    const existing = await this.empresas.findOne({
      where: { nombre: dto.nombre },
    });
    if (existing) {
      throw new ConflictException('Ya existe una empresa con ese nombre.');
    }
    return this.empresas.save(this.empresas.create(dto));
  }

  async findAll(): Promise<EmpresaConHoras[]> {
    return this.conHorasEfectivas(
      await this.empresas.find({ order: { nombre: 'ASC' } }),
    );
  }

  async findByIdConHoras(id: string): Promise<EmpresaConHoras> {
    const [empresa] = await this.conHorasEfectivas([await this.findById(id)]);
    return empresa;
  }

  /**
   * Horas contratadas que rigen por empresa. Sin `horasFijas`: suma de `total_sesiones` de los
   * ciclos de sus coachees abiertos dentro del período del contrato (fecha_inicio..fecha_fin,
   * si están definidas) × la duración de una sesión. Con `horasFijas`: el valor manual.
   */
  async horasEfectivas(
    empresas: Empresa[],
  ): Promise<Map<string, number | null>> {
    const resultado = new Map<string, number | null>();
    const calculadas = empresas.filter((e) => !e.horasFijas);
    for (const e of empresas) {
      if (e.horasFijas) resultado.set(e.id, e.horasContratadas);
    }
    if (calculadas.length === 0) return resultado;
    const filas = await this.empresas.manager.query<
      { empresaId: string; sesiones: number }[]
    >(
      `SELECT c.empresa_id AS "empresaId", COALESCE(SUM(ci.total_sesiones), 0)::int AS sesiones
         FROM ciclos_coaching ci
         JOIN coachees c ON c.id = ci.coachee_id
         JOIN empresas e ON e.id = c.empresa_id
        WHERE c.empresa_id = ANY($1)
          AND (e.fecha_inicio IS NULL OR ci.fecha_apertura >= e.fecha_inicio)
          AND (e.fecha_fin IS NULL OR ci.fecha_apertura < e.fecha_fin + 1)
        GROUP BY c.empresa_id`,
      [calculadas.map((e) => e.id)],
    );
    const sesionesPorEmpresa = new Map(
      filas.map((f) => [f.empresaId, f.sesiones]),
    );
    for (const e of calculadas) {
      const sesiones = sesionesPorEmpresa.get(e.id) ?? 0;
      resultado.set(
        e.id,
        Math.round((sesiones * SESION_DURACION_MINUTOS) / 60),
      );
    }
    return resultado;
  }

  private async conHorasEfectivas(
    empresas: Empresa[],
  ): Promise<EmpresaConHoras[]> {
    const horas = await this.horasEfectivas(empresas);
    return empresas.map((e) =>
      Object.assign(e, { horasContratadasEfectivas: horas.get(e.id) ?? null }),
    );
  }

  async findById(id: string): Promise<Empresa> {
    const empresa = await this.empresas.findOne({ where: { id } });
    if (!empresa) {
      throw new NotFoundException('Empresa no encontrada.');
    }
    return empresa;
  }

  exists(id: string): Promise<boolean> {
    return this.empresas.exists({ where: { id } });
  }

  async update(id: string, dto: UpdateEmpresaDto): Promise<Empresa> {
    const empresa = await this.findById(id);
    assignDefined(empresa, dto);
    return this.empresas.save(empresa);
  }

  async remove(id: string): Promise<string> {
    const empresa = await this.findById(id);
    const [{ total }] = await this.empresas.manager.query<[{ total: number }]>(
      `SELECT (
        (SELECT COUNT(*) FROM coachees WHERE empresa_id = $1) +
        (SELECT COUNT(*) FROM users WHERE empresa_id = $1)
      )::int AS total`,
      [id],
    );
    if (total > 0) {
      throw new ConflictException(
        'No se puede eliminar: la empresa tiene coachees o usuarios asociados. Reasígnalos primero.',
      );
    }
    const nombre = empresa.nombre;
    await this.empresas.remove(empresa);
    return nombre;
  }

  async crearGestion(
    empresaId: string,
    dto: CreateGestionDto,
  ): Promise<GestionRenovacion> {
    await this.findById(empresaId);
    return this.gestiones.save(
      this.gestiones.create({
        empresaId,
        nota: dto.nota,
        proximoSeguimiento: dto.proximoSeguimiento ?? null,
      }),
    );
  }

  async listGestionDeEmpresa(empresaId: string): Promise<GestionRenovacion[]> {
    await this.findById(empresaId);
    return this.gestiones.find({
      where: { empresaId },
      order: { createdAt: 'DESC' },
    });
  }

  // Una consulta agrupada en JS en vez de N+1 — volumen bajo (una fila por empresa), evita
  // pelear con un GROUP BY/DISTINCT ON de Postgres para algo que carteraEmpresas() necesita
  // para todas las empresas a la vez.
  async ultimaGestionPorEmpresa(): Promise<Map<string, GestionRenovacion>> {
    const todas = await this.gestiones.find({ order: { createdAt: 'DESC' } });
    const mapa = new Map<string, GestionRenovacion>();
    for (const gestion of todas) {
      if (!mapa.has(gestion.empresaId)) mapa.set(gestion.empresaId, gestion);
    }
    return mapa;
  }

  async getCompetencias(empresaId: string): Promise<EmpresaCompetencia[]> {
    await this.findById(empresaId);
    return this.empresaCompetencias.find({
      where: { empresaId },
      relations: { competencia: true },
    });
  }

  /**
   * Reemplaza el set completo — más simple y robusto para una UI de checklist que un diff
   * incremental, y el volumen (un puñado de competencias por empresa) no justifica optimizar.
   */
  async setCompetencias(
    empresaId: string,
    competenciaIds: string[],
  ): Promise<EmpresaCompetencia[]> {
    await this.findById(empresaId);
    await this.empresaCompetencias.delete({ empresaId });
    if (competenciaIds.length === 0) return [];
    const filas = competenciaIds.map((competenciaId) =>
      this.empresaCompetencias.create({ empresaId, competenciaId }),
    );
    await this.empresaCompetencias.save(filas);
    return this.getCompetencias(empresaId);
  }
}
