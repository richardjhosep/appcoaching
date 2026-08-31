import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Coachee } from '../../coachees/entities/coachee.entity';
import { Competencia } from '../../competencias/entities/competencia.entity';

// El coachee marca en qué nivel de una competencia cree estar y aporta evidencia concreta
// (el campo "Ejemplo" de la plantilla real de evaluación de competencias) — a diferencia de
// `PlanDesarrollo.nivelActual` (un número suelto, de libre edición, sin evidencia), esto es
// un historial: puede haber varias autoevaluaciones en el tiempo para la misma competencia.
@Entity('autoevaluaciones_competencia')
export class AutoevaluacionCompetencia {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'coachee_id', type: 'uuid' })
  coacheeId: string;

  @ManyToOne(() => Coachee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'coachee_id' })
  coachee?: Coachee;

  @Column({ name: 'competencia_id', type: 'uuid' })
  competenciaId: string;

  @ManyToOne(() => Competencia, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'competencia_id' })
  competencia?: Competencia;

  @Column({ type: 'int' })
  nivel: number;

  @Column({ type: 'text' })
  ejemplo: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
