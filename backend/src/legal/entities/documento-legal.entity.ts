import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Empresa } from '../../empresas/entities/empresa.entity';
import { Coachee } from '../../coachees/entities/coachee.entity';
import { TipoDocumentoLegal } from '../enums/tipo-documento-legal.enum';
import { EstadoDocumentoLegal } from '../enums/estado-documento-legal.enum';

/**
 * Contrato/NDA de una relación de coaching. Apunta a exactamente una de dos
 * partes (CHK_documentos_legales_target a nivel de BD): una empresa cliente,
 * o un coachee independiente (sin empresa) que firma directo con el coach.
 */
@Entity('documentos_legales')
@Unique(['empresaId', 'tipo'])
@Unique(['coacheeId', 'tipo'])
export class DocumentoLegal {
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

  @Column({ type: 'enum', enum: TipoDocumentoLegal })
  tipo: TipoDocumentoLegal;

  @Column({
    type: 'enum',
    enum: EstadoDocumentoLegal,
    default: EstadoDocumentoLegal.PENDIENTE,
  })
  estado: EstadoDocumentoLegal;

  @Column({ type: 'date', nullable: true })
  fecha: string | null;

  @Column({ type: 'date', nullable: true })
  vigencia: string | null;

  @Column({ name: 'archivo_path', type: 'varchar', nullable: true })
  archivoPath: string | null;

  @Column({ name: 'archivo_nombre', type: 'varchar', nullable: true })
  archivoNombre: string | null;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
