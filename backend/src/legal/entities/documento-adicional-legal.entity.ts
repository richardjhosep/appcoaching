import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Empresa } from '../../empresas/entities/empresa.entity';
import { Coachee } from '../../coachees/entities/coachee.entity';

/**
 * Archivo suelto (correo, addendum, evidencia) con título libre, sin límite
 * de cantidad, adjunto a una empresa o a un coachee (exactamente uno de los
 * dos — CHK_documentos_adicionales_target a nivel de BD). Complementa a
 * DocumentoLegal (que solo modela Contrato/NDA, uno por tipo).
 */
@Entity('documentos_adicionales_legales')
export class DocumentoAdicionalLegal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'empresa_id', type: 'uuid', nullable: true })
  empresaId: string | null;

  @ManyToOne(() => Empresa, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'empresa_id' })
  empresa?: Empresa | null;

  @Column({ name: 'coachee_id', type: 'uuid', nullable: true })
  coacheeId: string | null;

  @ManyToOne(() => Coachee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'coachee_id' })
  coachee?: Coachee | null;

  @Column()
  titulo: string;

  @Column({ name: 'archivo_path' })
  archivoPath: string;

  @Column({ name: 'archivo_nombre' })
  archivoNombre: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
