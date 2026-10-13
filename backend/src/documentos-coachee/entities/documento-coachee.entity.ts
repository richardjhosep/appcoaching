import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Coachee } from '../../coachees/entities/coachee.entity';
import { Role } from '../../auth/enums/role.enum';
import { TipoDocumentoCoachee } from '../enums/tipo-documento-coachee.enum';

/**
 * Documento del proceso de un coachee, compartido entre los 3 roles: lo puede subir la
 * empresa, el propio coachee o el coach, y lo ven los tres — así nadie vuelve a cargar lo que
 * otro ya subió (a veces la empresa tarda y el coachee lo comparte antes). Distinto de
 * `recursos_personales`, que es 100% privado del coachee.
 */
@Entity('documentos_coachee')
export class DocumentoCoachee {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'coachee_id', type: 'uuid' })
  coacheeId: string;

  @ManyToOne(() => Coachee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'coachee_id' })
  coachee?: Coachee;

  @Column({ type: 'enum', enum: TipoDocumentoCoachee })
  tipo: TipoDocumentoCoachee;

  // Descripción libre opcional (ej. "Evaluación 2025", "Descriptor actualizado").
  @Column({ type: 'varchar', nullable: true })
  descripcion: string | null;

  @Column({ name: 'archivo_path', type: 'varchar' })
  archivoPath: string;

  @Column({ name: 'archivo_nombre', type: 'varchar' })
  archivoNombre: string;

  @Column({ name: 'subido_por_user_id', type: 'uuid' })
  subidoPorUserId: string;

  // Rol de quien lo subió — para mostrar "Subido por la empresa / por ti / por tu coach".
  @Column({ name: 'subido_por_rol', type: 'enum', enum: Role })
  subidoPorRol: Role;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
