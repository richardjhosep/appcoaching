import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PlanDesarrollo } from './plan-desarrollo.entity';

@Entity('objetivos_especificos')
export class ObjetivoEspecifico {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'plan_id', type: 'uuid' })
  planId: string;

  @ManyToOne(() => PlanDesarrollo, (plan) => plan.objetivos, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'plan_id' })
  plan?: PlanDesarrollo;

  @Column({ type: 'text' })
  descripcion: string;

  @Column({ type: 'int', default: 1 })
  orden: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
