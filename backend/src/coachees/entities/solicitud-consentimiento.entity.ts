import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Coachee } from './coachee.entity';
import { EstadoSolicitudConsentimiento } from '../enums/estado-solicitud-consentimiento.enum';

/**
 * Solicitud de consentimiento informado enviada por correo a un coachee, con un
 * token único de un solo uso. A diferencia del toggle manual del coach, la
 * respuesta acá es del propio coachee — es la evidencia real de que fue él/ella
 * quien consintió, no una afirmación del coach.
 */
@Entity('solicitudes_consentimiento')
export class SolicitudConsentimiento {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'coachee_id', type: 'uuid' })
  coacheeId: string;

  @ManyToOne(() => Coachee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'coachee_id' })
  coachee?: Coachee;

  @Column({ unique: true })
  token: string;

  @Column({
    type: 'enum',
    enum: EstadoSolicitudConsentimiento,
    default: EstadoSolicitudConsentimiento.PENDIENTE,
  })
  estado: EstadoSolicitudConsentimiento;

  @Column({ name: 'expira_en', type: 'timestamptz' })
  expiraEn: Date;

  @Column({ name: 'respondido_en', type: 'timestamptz', nullable: true })
  respondidoEn: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
