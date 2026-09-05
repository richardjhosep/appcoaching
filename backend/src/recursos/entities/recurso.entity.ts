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
import { Competencia } from '../../competencias/entities/competencia.entity';

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

  // Opcional — liga el recurso a una competencia del catálogo, mismo campo
  // que ya tienen Quiz/Flashcard/MapaMental. Con esto, "Formación complementaria"
  // del plan se deriva automáticamente en vez de ser texto libre del coach.
  @Column({ name: 'competencia_id', type: 'uuid', nullable: true })
  competenciaId: string | null;

  @ManyToOne(() => Competencia, { nullable: true })
  @JoinColumn({ name: 'competencia_id' })
  competencia?: Competencia | null;

  @Column({ type: 'enum', enum: TipoRecurso })
  tipo: TipoRecurso;

  @Column({ type: 'varchar', nullable: true })
  url: string | null;

  @Column({ name: 'archivo_nombre', type: 'varchar', nullable: true })
  archivoNombre: string | null;

  @Column({ name: 'archivo_path', type: 'varchar', nullable: true })
  archivoPath: string | null;

  // Opcional — pasada esta fecha (fin del día en horario de Chile), el recurso deja de
  // aparecer en la biblioteca de CUALQUIER coachee, sin importar cómo obtuvo acceso
  // (carpeta visible o asignación directa). Distinto de AsignacionRecurso.expiraEn, que es
  // el vencimiento del acceso puntual de un coachee, no del recurso en sí.
  @Column({ name: 'fecha_limite', type: 'timestamptz', nullable: true })
  fechaLimite: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
