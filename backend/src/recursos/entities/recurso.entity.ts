import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TipoRecurso } from '../enums/tipo-recurso.enum';

@Entity('recursos')
export class Recurso {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  titulo: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string | null;

  @Column({ type: 'simple-array', nullable: true })
  etiquetas: string[] | null;

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
