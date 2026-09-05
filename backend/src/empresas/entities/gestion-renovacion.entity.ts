import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Empresa } from './empresa.entity';

// Bitácora de gestión de renovación por empresa — se agrega, no se edita ni se borra (mismo
// criterio que Logro: un historial no se reescribe). Alimenta el semáforo de la cartera del
// dashboard del coach y el bloque "Atención inmediata" (contratos por vencer sin gestión).
@Entity('gestiones_renovacion')
export class GestionRenovacion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'empresa_id', type: 'uuid' })
  empresaId: string;

  @ManyToOne(() => Empresa, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'empresa_id' })
  empresa?: Empresa;

  @Column({ type: 'text' })
  nota: string;

  @Column({ name: 'proximo_seguimiento', type: 'date', nullable: true })
  proximoSeguimiento: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
