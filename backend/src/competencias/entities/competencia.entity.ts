import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export interface NivelCompetencia {
  nivel: number;
  descripcion: string;
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
