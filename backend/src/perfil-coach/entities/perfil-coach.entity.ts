import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CertificacionCoach } from './certificacion-coach.entity';

// Una fila por coach (hoy hay un solo coach, pero se ata a `coachUserId` en vez de ser un
// singleton puro — si algún día se soporta multi-coach, no hay que migrar nada). Sin FK
// formal a `User` a propósito: este módulo no depende de `UsersModule`, la validación de que
// el `coachUserId` corresponde a un coach real la hace el service.
@Entity('perfiles_coach')
export class PerfilCoach {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'coach_user_id', type: 'uuid', unique: true })
  coachUserId: string;

  @Column({ default: '' })
  nombre: string;

  @Column({ type: 'varchar', nullable: true })
  titulo: string | null;

  @Column({ type: 'text', nullable: true })
  bio: string | null;

  @Column({ name: 'linkedin_url', type: 'varchar', nullable: true })
  linkedinUrl: string | null;

  @Column({ name: 'sitio_web', type: 'varchar', nullable: true })
  sitioWeb: string | null;

  @Column({ name: 'instagram_url', type: 'varchar', nullable: true })
  instagramUrl: string | null;

  @Column({ name: 'facebook_url', type: 'varchar', nullable: true })
  facebookUrl: string | null;

  @Column({ name: 'youtube_url', type: 'varchar', nullable: true })
  youtubeUrl: string | null;

  @Column({ type: 'varchar', nullable: true })
  telefono: string | null;

  @Column({ name: 'email_contacto', type: 'varchar', nullable: true })
  emailContacto: string | null;

  @Column({ type: 'text', nullable: true })
  metodologia: string | null;

  @Column({ name: 'foto_path', type: 'varchar', nullable: true })
  fotoPath: string | null;

  @Column({ name: 'foto_nombre', type: 'varchar', nullable: true })
  fotoNombre: string | null;

  @Column({ name: 'cv_path', type: 'varchar', nullable: true })
  cvPath: string | null;

  @Column({ name: 'cv_nombre', type: 'varchar', nullable: true })
  cvNombre: string | null;

  @OneToMany(() => CertificacionCoach, (c) => c.perfil)
  certificaciones?: CertificacionCoach[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
