import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Empresa } from './entities/empresa.entity';
import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { UpdateEmpresaDto } from './dto/update-empresa.dto';
import { assignDefined } from '../common/assign-defined.util';

@Injectable()
export class EmpresasService {
  constructor(
    @InjectRepository(Empresa) private readonly empresas: Repository<Empresa>,
  ) {}

  async create(dto: CreateEmpresaDto): Promise<Empresa> {
    const existing = await this.empresas.findOne({
      where: { nombre: dto.nombre },
    });
    if (existing) {
      throw new ConflictException('A company with that name already exists');
    }
    return this.empresas.save(this.empresas.create(dto));
  }

  findAll(): Promise<Empresa[]> {
    return this.empresas.find({ order: { nombre: 'ASC' } });
  }

  async findById(id: string): Promise<Empresa> {
    const empresa = await this.empresas.findOne({ where: { id } });
    if (!empresa) {
      throw new NotFoundException('Empresa not found');
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

  async remove(id: string): Promise<void> {
    const empresa = await this.findById(id);
    const [{ total }] = (await this.empresas.manager.query(
      `SELECT (
        (SELECT COUNT(*) FROM coachees WHERE empresa_id = $1) +
        (SELECT COUNT(*) FROM users WHERE empresa_id = $1)
      )::int AS total`,
      [id],
    )) as [{ total: number }];
    if (total > 0) {
      throw new ConflictException(
        'No se puede eliminar: la empresa tiene coachees o usuarios asociados. Reasígnalos primero.',
      );
    }
    await this.empresas.remove(empresa);
  }
}
