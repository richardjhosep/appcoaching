import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Sesion } from './sesion.entity';
import { EstadoSolicitud } from '../enums/estado-solicitud.enum';

@Entity('solicitudes_reagendamiento')
export class SolicitudReagendamiento {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'sesion_id', type: 'uuid' })
  sesionId: string;

  @ManyToOne(() => Sesion, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sesion_id' })
  sesion?: Sesion;

  @Column({ name: 'coachee_id', type: 'uuid' })
  coacheeId: string;

  @Column({ type: 'text', nullable: true })
  motivo: string | null;

  @Column({
    type: 'enum',
    enum: EstadoSolicitud,
    default: EstadoSolicitud.PENDIENTE,
  })
  estado: EstadoSolicitud;

  @Column({ name: 'respuesta_coach', type: 'text', nullable: true })
  respuestaCoach: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'resolved_at', type: 'timestamptz', nullable: true })
  resolvedAt: Date | null;
}
