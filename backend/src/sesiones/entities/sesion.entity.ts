import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Coachee } from '../../coachees/entities/coachee.entity';
import { CicloCoaching } from '../../ciclos/entities/ciclo-coaching.entity';

@Entity('sesiones')
export class Sesion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'coachee_id', type: 'uuid' })
  coacheeId: string;

  @ManyToOne(() => Coachee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'coachee_id' })
  coachee?: Coachee;

  @Column({ name: 'ciclo_id', type: 'uuid', nullable: true })
  cicloId: string | null;

  @ManyToOne(() => CicloCoaching, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'ciclo_id' })
  ciclo?: CicloCoaching;

  @Column({ name: 'fecha_hora', type: 'timestamptz' })
  fechaHora: Date;

  @Column({ name: 'link_videollamada', type: 'varchar', nullable: true })
  linkVideollamada: string | null;

  @Column({ name: 'resumen_compartido', type: 'text', nullable: true })
  resumenCompartido: string | null;

  @Column({ name: 'notas_privadas', type: 'text', nullable: true })
  notasPrivadas: string | null;

  @Column({ type: 'boolean', nullable: true })
  asistio: boolean | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
