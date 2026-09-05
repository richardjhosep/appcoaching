import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PerfilCoach } from './perfil-coach.entity';

// Lista estructurada (no un cajón de "documentos" sueltos): cada certificación tiene su
// propio nombre/entidad/archivo, como la sección "Licencias y certificaciones" de LinkedIn.
@Entity('certificaciones_coach')
export class CertificacionCoach {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'perfil_coach_id', type: 'uuid' })
  perfilCoachId: string;

  @ManyToOne(() => PerfilCoach, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'perfil_coach_id' })
  perfil?: PerfilCoach;

  @Column()
  nombre: string;

  @Column({ name: 'entidad_emisora', type: 'varchar', nullable: true })
  entidadEmisora: string | null;

  @Column({ type: 'date', nullable: true })
  fecha: string | null;

  @Column({ name: 'archivo_path', type: 'varchar', nullable: true })
  archivoPath: string | null;

  @Column({ name: 'archivo_nombre', type: 'varchar', nullable: true })
  archivoNombre: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
