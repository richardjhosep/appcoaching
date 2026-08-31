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

  @Column({ unique: true })
  nombre: string;

  @Column({ type: 'text' })
  definicion: string;

  @Column({ type: 'jsonb' })
  niveles: NivelCompetencia[];
}
