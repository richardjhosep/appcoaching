import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Coachee } from '../../coachees/entities/coachee.entity';
import { CategoriaRecursoPersonal } from '../enums/categoria-recurso-personal.enum';

// Material de formación que el propio coachee encontró y quiere registrar (un libro,
// un artículo, un video...) — 100% privado, mismo criterio que MapaPersonal/NotaPizarra:
// ni el coach ni la empresa tienen ninguna ruta sobre esto. A diferencia de Recurso
// (autoría del coach, con competenciaId/carpetaId/fechaLimite/asignaciones), acá no hay
// nada de eso: es un registro personal, no contenido asignado.
@Entity('recursos_personales')
export class RecursoPersonal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'coachee_id', type: 'uuid' })
  coacheeId: string;

  @ManyToOne(() => Coachee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'coachee_id' })
  coachee?: Coachee;

  @Column({ type: 'enum', enum: CategoriaRecursoPersonal })
  categoria: CategoriaRecursoPersonal;

  @Column({ type: 'varchar' })
  titulo: string;

  @Column({ type: 'varchar', nullable: true })
  url: string | null;

  @Column({ type: 'text', nullable: true })
  notas: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
