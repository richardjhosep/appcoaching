import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Empresa } from '../../empresas/entities/empresa.entity';

@Entity('encuestas_satisfaccion')
export class EncuestaSatisfaccion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'empresa_id', type: 'uuid' })
  empresaId: string;

  @ManyToOne(() => Empresa, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'empresa_id' })
  empresa?: Empresa;

  @Column({ type: 'int' })
  calificacion: number;

  @Column({ type: 'text', nullable: true })
  comentario: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
