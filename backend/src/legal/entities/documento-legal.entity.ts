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
import { TipoDocumentoLegal } from '../enums/tipo-documento-legal.enum';
import { EstadoDocumentoLegal } from '../enums/estado-documento-legal.enum';

@Entity('documentos_legales')
@Unique(['empresaId', 'tipo'])
export class DocumentoLegal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'empresa_id', type: 'uuid' })
  empresaId: string;

  @ManyToOne(() => Empresa, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'empresa_id' })
  empresa?: Empresa;

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

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
