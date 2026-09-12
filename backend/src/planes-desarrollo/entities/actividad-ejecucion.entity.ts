import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PlanDesarrollo } from './plan-desarrollo.entity';
import { ObjetivoEspecifico } from './objetivo-especifico.entity';
import { EstadoActividad } from '../enums/estado-actividad.enum';

@Entity('actividades_ejecucion')
export class ActividadEjecucion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'plan_id', type: 'uuid' })
  planId: string;

  @ManyToOne(() => PlanDesarrollo, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'plan_id' })
  plan?: PlanDesarrollo;

  @Column({ name: 'objetivo_id', type: 'uuid' })
  objetivoId: string;

  @ManyToOne(() => ObjetivoEspecifico, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'objetivo_id' })
  objetivo?: ObjetivoEspecifico;

  @Column({ type: 'text' })
  actividad: string;

  // Fecha calendario real (no un instante — por eso `date`, no `timestamptz`, mismo
  // criterio que Empresa.fechaInicio/fechaFin). Antes era texto libre ("Semana 1"), sin
  // relación con las fechas reales del ciclo del coachee.
  @Column({ name: 'fecha_inicio', type: 'date', nullable: true })
  fechaInicio: string | null;

  @Column({ name: 'fecha_fin', type: 'date', nullable: true })
  fechaFin: string | null;

  @Column({
    type: 'enum',
    enum: EstadoActividad,
    default: EstadoActividad.PENDIENTE,
  })
  estado: EstadoActividad;

  // Relato de qué pasó al ejecutar la actividad — es el campo más usado en la plantilla real
  // (Excel de Plan de Desarrollo), no existía lugar para él hasta ahora.
  @Column({ type: 'text', nullable: true })
  observaciones: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
