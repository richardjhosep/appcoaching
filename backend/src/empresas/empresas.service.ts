import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Empresa } from './entities/empresa.entity';
import { GestionRenovacion } from './entities/gestion-renovacion.entity';
import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { UpdateEmpresaDto } from './dto/update-empresa.dto';
import { CreateGestionDto } from './dto/create-gestion.dto';
import { assignDefined } from '../common/assign-defined.util';

@Injectable()
export class EmpresasService {
  constructor(
    @InjectRepository(Empresa) private readonly empresas: Repository<Empresa>,
    @InjectRepository(GestionRenovacion)
    private readonly gestiones: Repository<GestionRenovacion>,
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

  findAll(): Promise<Empresa[]> {
    return this.empresas.find({ order: { nombre: 'ASC' } });
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
}
