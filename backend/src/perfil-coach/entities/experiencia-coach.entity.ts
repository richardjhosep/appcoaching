import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PerfilCoach } from './perfil-coach.entity';

// Lista estructurada de experiencia laboral — empresas a las que el coach le ha prestado
// servicio, mismo criterio de "Experiencia" de LinkedIn. `fechaFin` null = "actualidad".
@Entity('experiencias_coach')
export class ExperienciaCoach {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'perfil_coach_id', type: 'uuid' })
  perfilCoachId: string;

  @ManyToOne(() => PerfilCoach, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'perfil_coach_id' })
  perfil?: PerfilCoach;

  @Column()
  empresa: string;

  @Column({ type: 'varchar', nullable: true })
  cargo: string | null;

  @Column({ name: 'fecha_inicio', type: 'date' })
  fechaInicio: string;

  @Column({ name: 'fecha_fin', type: 'date', nullable: true })
  fechaFin: string | null;

  @Column({ type: 'text', nullable: true })
  descripcion: string | null;

  @Column({ name: 'logo_path', type: 'varchar', nullable: true })
  logoPath: string | null;

  @Column({ name: 'logo_nombre', type: 'varchar', nullable: true })
  logoNombre: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
