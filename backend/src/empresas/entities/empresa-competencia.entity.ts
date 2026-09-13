import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Empresa } from './empresa.entity';
import { Competencia } from '../../competencias/entities/competencia.entity';

/**
 * #3 del backlog: la primera relación muchos-a-muchos del modelo — todo lo demás
 * (Recurso, PlanDesarrollo, Quiz, etc.) es una FK simple a una sola competencia. Acá una
 * empresa define de antemano qué competencias son prioritarias/contratadas para su
 * equipo — una intención, distinta de "competencias trabajadas" (que se DERIVA de los
 * planes de desarrollo reales de sus coachees, ver lib/distribucionEquipo.ts en el
 * frontend). Sin metadata extra (prioridad, fecha): un set plano de competencias.
 */
@Entity('empresa_competencias')
@Unique(['empresaId', 'competenciaId'])
export class EmpresaCompetencia {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'empresa_id', type: 'uuid' })
  empresaId: string;

  @ManyToOne(() => Empresa, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'empresa_id' })
  empresa?: Empresa;

  @Column({ name: 'competencia_id', type: 'uuid' })
  competenciaId: string;

  @ManyToOne(() => Competencia, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'competencia_id' })
  competencia?: Competencia;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
