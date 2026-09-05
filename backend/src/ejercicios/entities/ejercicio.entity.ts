import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Competencia } from '../../competencias/entities/competencia.entity';
import { VersionEjercicio } from './version-ejercicio.entity';

// Plantilla del ejercicio, creada por el coach — inspirado en la hoja "knowdofeel" del
// Excel real: el coachee redacta un mensaje difícil estructurado en Sabe/Siente/Haga,
// puede iterar en varias versiones, y el coach deja feedback por versión.
@Entity('ejercicios')
export class Ejercicio {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  titulo: string;

  // Contexto del ejercicio — ej. "Redacta un mensaje para pedirle a tu jefe una reunión de
  // equipo semanal" — lo que el coachee ve antes de empezar a escribir.
  @Column({ type: 'text' })
  consigna: string;

  @Column({ name: 'competencia_id', type: 'uuid', nullable: true })
  competenciaId: string | null;

  @ManyToOne(() => Competencia, { nullable: true })
  @JoinColumn({ name: 'competencia_id' })
  competencia?: Competencia | null;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  // Opcional — pasada esta fecha (fin del día en horario de Chile), el ejercicio deja de
  // aparecer como disponible para el coachee sin que el coach tenga que desactivarlo a mano.
  @Column({ name: 'fecha_limite', type: 'timestamptz', nullable: true })
  fechaLimite: Date | null;

  @OneToMany(() => VersionEjercicio, (v) => v.ejercicio)
  versiones?: VersionEjercicio[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
