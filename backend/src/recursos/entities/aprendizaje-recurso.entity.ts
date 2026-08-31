import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Recurso } from './recurso.entity';
import { Coachee } from '../../coachees/entities/coachee.entity';

@Entity('aprendizajes_recurso')
export class AprendizajeRecurso {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'recurso_id', type: 'uuid' })
  recursoId: string;

  @ManyToOne(() => Recurso, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'recurso_id' })
  recurso?: Recurso;

  @Column({ name: 'coachee_id', type: 'uuid' })
  coacheeId: string;

  @ManyToOne(() => Coachee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'coachee_id' })
  coachee?: Coachee;

  @Column({ type: 'text' })
  contenido: string;

  // "¿Cómo se aplica a mi trabajo?" — separado de `contenido` porque en la plantilla real
  // (Excel de Plan de Desarrollo y la pauta en papel que usa el coach) son 2 columnas distintas.
  @Column({ type: 'text', nullable: true })
  aplicacion: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
