import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Ejercicio } from './ejercicio.entity';
import { Coachee } from '../../coachees/entities/coachee.entity';
import { EstadoVersionEjercicio } from '../enums/estado-version-ejercicio.enum';

@Entity('versiones_ejercicio')
export class VersionEjercicio {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'ejercicio_id', type: 'uuid' })
  ejercicioId: string;

  @ManyToOne(() => Ejercicio, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ejercicio_id' })
  ejercicio?: Ejercicio;

  @Column({ name: 'coachee_id', type: 'uuid' })
  coacheeId: string;

  @ManyToOne(() => Coachee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'coachee_id' })
  coachee?: Coachee;

  // Numerada por coachee+ejercicio (1, 2, 3...) — cada versión es un snapshot inmutable
  // de lo que el coachee redactó, no se sobrescribe: iterar significa crear la siguiente.
  @Column({ name: 'numero_version', type: 'int' })
  numeroVersion: number;

  @Column({ type: 'text' })
  sabe: string;

  @Column({ type: 'text' })
  siente: string;

  @Column({ type: 'text' })
  haga: string;

  @Column({ name: 'comentario_coach', type: 'text', nullable: true })
  comentarioCoach: string | null;

  @Column({
    type: 'enum',
    enum: EstadoVersionEjercicio,
    default: EstadoVersionEjercicio.ENVIADA,
  })
  estado: EstadoVersionEjercicio;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
