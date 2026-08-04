import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TipoRecurso } from '../enums/tipo-recurso.enum';
import { Carpeta } from './carpeta.entity';

@Entity('recursos')
export class Recurso {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  titulo: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string | null;

  @Column({ name: 'carpeta_id', type: 'uuid' })
  carpetaId: string;

  @ManyToOne(() => Carpeta)
  @JoinColumn({ name: 'carpeta_id' })
  carpeta?: Carpeta;

  @Column({ type: 'enum', enum: TipoRecurso })
  tipo: TipoRecurso;

  @Column({ type: 'varchar', nullable: true })
  url: string | null;

  @Column({ name: 'archivo_nombre', type: 'varchar', nullable: true })
  archivoNombre: string | null;

  @Column({ name: 'archivo_path', type: 'varchar', nullable: true })
  archivoPath: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
