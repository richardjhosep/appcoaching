import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Recurso } from './recurso.entity';
import { Coachee } from '../../coachees/entities/coachee.entity';
import { OrigenAsignacion } from '../enums/origen-asignacion.enum';

@Entity('asignaciones_recurso')
@Unique(['recursoId', 'coacheeId'])
export class AsignacionRecurso {
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

  @Column({ type: 'boolean', default: true })
  activa: boolean;

  @Column({ type: 'enum', enum: OrigenAsignacion })
  origen: OrigenAsignacion;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
