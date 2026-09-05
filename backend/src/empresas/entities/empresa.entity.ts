import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('empresas')
export class Empresa {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  nombre: string;

  @Column({ name: 'tarifa_hora', type: 'integer' })
  tarifaHora: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ default: false })
  pagada: boolean;

  @Column({ name: 'horas_contratadas', type: 'integer', nullable: true })
  horasContratadas: number | null;

  // Término del contrato — fecha calendario, no un instante (por eso `date`, no
  // `timestamptz`: sin hora ni zona horaria que resolver). Alimenta la "cartera de
  // empresas" del dashboard del coach (qué contrato vence este mes/semestre).
  @Column({ name: 'fecha_inicio', type: 'date', nullable: true })
  fechaInicio: string | null;

  @Column({ name: 'fecha_fin', type: 'date', nullable: true })
  fechaFin: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
