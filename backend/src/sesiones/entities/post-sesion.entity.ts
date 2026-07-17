import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Sesion } from './sesion.entity';

@Entity('post_sesiones')
export class PostSesion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'sesion_id', type: 'uuid', unique: true })
  sesionId: string;

  @OneToOne(() => Sesion, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sesion_id' })
  sesion?: Sesion;

  @Column({ type: 'text', nullable: true })
  aprendizaje: string | null;

  @Column({ type: 'int', nullable: true })
  utilidad: number | null;

  @Column({ name: 'cercania_objetivo', type: 'int', nullable: true })
  cercaniaObjetivo: number | null;

  @Column({ type: 'text', nullable: true })
  recomendacion: string | null;

  @Column({ name: 'temas_proxima_sesion', type: 'text', nullable: true })
  temasProximaSesion: string | null;

  @Column({ type: 'boolean', default: false })
  publicada: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
