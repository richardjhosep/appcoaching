import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Coachee } from '../../coachees/entities/coachee.entity';

// Nota tipo post-it en el lienzo personal de estudio del coachee — 100% privada, mismo
// criterio que MapaPersonal: ni el coach ni la empresa tienen ninguna ruta sobre esto.
@Entity('notas_pizarra')
export class NotaPizarra {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'coachee_id', type: 'uuid' })
  coacheeId: string;

  @ManyToOne(() => Coachee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'coachee_id' })
  coachee?: Coachee;

  @Column({ type: 'text', default: '' })
  texto: string;

  @Column({ type: 'varchar' })
  color: string;

  @Column({ name: 'pos_x', type: 'integer' })
  posX: number;

  @Column({ name: 'pos_y', type: 'integer' })
  posY: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
