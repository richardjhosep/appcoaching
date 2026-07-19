import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Coachee } from '../coachees/entities/coachee.entity';
import { Empresa } from '../empresas/entities/empresa.entity';
import { Competencia } from '../competencias/entities/competencia.entity';
import { Recurso } from '../recursos/entities/recurso.entity';

const LIMITE_POR_ENTIDAD = 5;

export interface ResultadoBusqueda {
  coachees: Array<{ id: string; nombre: string }>;
  empresas: Array<{ id: string; nombre: string }>;
  competencias: Array<{ id: string; nombre: string }>;
  recursos: Array<{ id: string; titulo: string }>;
}

@Injectable()
export class BusquedaService {
  constructor(
    @InjectRepository(Coachee) private readonly coachees: Repository<Coachee>,
    @InjectRepository(Empresa) private readonly empresas: Repository<Empresa>,
    @InjectRepository(Competencia)
    private readonly competencias: Repository<Competencia>,
    @InjectRepository(Recurso) private readonly recursos: Repository<Recurso>,
  ) {}

  async buscar(q: string): Promise<ResultadoBusqueda> {
    if (!q || q.trim().length === 0) {
      return { coachees: [], empresas: [], competencias: [], recursos: [] };
    }
    const termino = `%${q.trim()}%`;

    const [coachees, empresas, competencias, recursos] = await Promise.all([
      this.coachees.find({
        where: { nombre: ILike(termino) },
        take: LIMITE_POR_ENTIDAD,
        order: { nombre: 'ASC' },
      }),
      this.empresas.find({
        where: { nombre: ILike(termino) },
        take: LIMITE_POR_ENTIDAD,
        order: { nombre: 'ASC' },
      }),
      this.competencias.find({
        where: { nombre: ILike(termino) },
        take: LIMITE_POR_ENTIDAD,
        order: { nombre: 'ASC' },
      }),
      this.recursos.find({
        where: { titulo: ILike(termino) },
        take: LIMITE_POR_ENTIDAD,
        order: { titulo: 'ASC' },
      }),
    ]);

    return {
      coachees: coachees.map((c) => ({ id: c.id, nombre: c.nombre })),
      empresas: empresas.map((e) => ({ id: e.id, nombre: e.nombre })),
      competencias: competencias.map((c) => ({ id: c.id, nombre: c.nombre })),
      recursos: recursos.map((r) => ({ id: r.id, titulo: r.titulo })),
    };
  }
}
