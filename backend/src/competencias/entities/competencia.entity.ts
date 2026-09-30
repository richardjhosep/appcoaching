import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export interface NivelCompetencia {
  nivel: number;
  descripcion: string;
  // Comportamientos observables del nivel (bullets), tal como aparecen en la plantilla real
  // de evaluación de competencias. Opcional: solo está enriquecido para las competencias con
  // contenido fuente verificado; el resto del catálogo lo deja vacío hasta tener ese contenido.
  comportamientos?: string[];
}

@Entity('competencias')
export class Competencia {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nombre: string;

  @Column({ type: 'text' })
  definicion: string;

  @Column({ type: 'jsonb' })
  niveles: NivelCompetencia[];

  // NULL = catálogo global (sembrado por CompetenciasService, ver onApplicationBootstrap).
  // No nulo = competencia propia de esa empresa, creada/editada por su rol EMPRESA — nunca
  // tocada por el sync del catálogo global. El nombre ya no es único a secas (ver migración
  // CompetenciasPorEmpresa): único dentro del catálogo global, y por separado único dentro
  // de cada empresa.
  @Column({ name: 'empresa_id', type: 'uuid', nullable: true })
  empresaId: string | null;
}
