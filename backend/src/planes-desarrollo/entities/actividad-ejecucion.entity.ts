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

  @Column({ name: 'fecha_inicio', type: 'varchar', nullable: true })
  fechaInicio: string | null;

  @Column({ name: 'fecha_fin', type: 'varchar', nullable: true })
  fechaFin: string | null;

  @Column({
    type: 'enum',
    enum: EstadoActividad,
    default: EstadoActividad.PENDIENTE,
  })
  estado: EstadoActividad;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
