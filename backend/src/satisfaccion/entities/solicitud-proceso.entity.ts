import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Empresa } from '../../empresas/entities/empresa.entity';
import { EstadoSolicitudProceso } from '../enums/estado-solicitud-proceso.enum';

@Entity('solicitudes_proceso')
export class SolicitudProceso {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'empresa_id', type: 'uuid' })
  empresaId: string;

  @ManyToOne(() => Empresa, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'empresa_id' })
  empresa?: Empresa;

  @Column({ name: 'nombre_sugerido', type: 'varchar' })
  nombreSugerido: string;

  @Column({ type: 'text', nullable: true })
  mensaje: string | null;

  @Column({
    type: 'enum',
    enum: EstadoSolicitudProceso,
    default: EstadoSolicitudProceso.PENDIENTE,
  })
  estado: EstadoSolicitudProceso;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
