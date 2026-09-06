import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Prospecto } from './prospecto.entity';

// Bitácora de seguimiento del prospecto — se agrega, no se edita ni se borra (mismo criterio
// que GestionRenovacion de Empresa, del que es copia directa).
@Entity('gestiones_prospecto')
export class GestionProspecto {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'prospecto_id', type: 'uuid' })
  prospectoId: string;

  @ManyToOne(() => Prospecto, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'prospecto_id' })
  prospecto?: Prospecto;

  @Column({ type: 'text' })
  nota: string;

  @Column({ name: 'proximo_seguimiento', type: 'date', nullable: true })
  proximoSeguimiento: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
