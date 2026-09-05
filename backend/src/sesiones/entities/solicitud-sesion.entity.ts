import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Coachee } from '../../coachees/entities/coachee.entity';
import { Sesion } from './sesion.entity';
import { EstadoSolicitudSesion } from '../enums/estado-solicitud-sesion.enum';

@Entity('solicitudes_sesion')
export class SolicitudSesion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'coachee_id', type: 'uuid' })
  coacheeId: string;

  @ManyToOne(() => Coachee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'coachee_id' })
  coachee?: Coachee;

  @Column({ name: 'fecha_hora_propuesta', type: 'timestamptz' })
  fechaHoraPropuesta: Date;

  @Column({ type: 'text', nullable: true })
  motivo: string | null;

  @Column({
    type: 'enum',
    enum: EstadoSolicitudSesion,
    default: EstadoSolicitudSesion.PENDIENTE,
  })
  estado: EstadoSolicitudSesion;

  @Column({ name: 'respuesta_coach', type: 'text', nullable: true })
  respuestaCoach: string | null;

  @Column({ name: 'sesion_creada_id', type: 'uuid', nullable: true })
  sesionCreadaId: string | null;

  @ManyToOne(() => Sesion, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'sesion_creada_id' })
  sesionCreada?: Sesion;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'resolved_at', type: 'timestamptz', nullable: true })
  resolvedAt: Date | null;
}
