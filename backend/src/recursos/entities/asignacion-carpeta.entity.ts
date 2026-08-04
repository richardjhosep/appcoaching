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
import { Carpeta } from './carpeta.entity';
import { Coachee } from '../../coachees/entities/coachee.entity';

@Entity('asignaciones_carpeta')
@Unique(['carpetaId', 'coacheeId'])
export class AsignacionCarpeta {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'carpeta_id', type: 'uuid' })
  carpetaId: string;

  @ManyToOne(() => Carpeta, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'carpeta_id' })
  carpeta?: Carpeta;

  @Column({ name: 'coachee_id', type: 'uuid' })
  coacheeId: string;

  @ManyToOne(() => Coachee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'coachee_id' })
  coachee?: Coachee;

  @Column({ type: 'boolean', default: true })
  activa: boolean;

  @Column({ name: 'expira_en', type: 'timestamptz', nullable: true })
  expiraEn: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
