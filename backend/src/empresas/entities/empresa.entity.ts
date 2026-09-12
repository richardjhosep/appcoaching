import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Moneda } from '../../common/moneda.enum';
import { numericTransformer } from '../../common/numeric-column.transformer';

@Entity('empresas')
export class Empresa {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  nombre: string;

  // `numeric` (no `integer`): en UF el monto es fraccionario (ej. 3.5 UF/hora). El valor
  // se interpreta según `tarifaHoraMoneda` — NegocioService lo convierte a CLP con el
  // valor UF del día antes de sumarlo a cualquier total (ver IndicadoresService).
  @Column({
    name: 'tarifa_hora',
    type: 'numeric',
    precision: 12,
    scale: 2,
    transformer: numericTransformer,
  })
  tarifaHora: number;

  @Column({
    name: 'tarifa_hora_moneda',
    type: 'enum',
    enum: Moneda,
    default: Moneda.CLP,
  })
  tarifaHoraMoneda: Moneda;

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
