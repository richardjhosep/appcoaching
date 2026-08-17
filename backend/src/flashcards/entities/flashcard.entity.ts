import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Competencia } from '../../competencias/entities/competencia.entity';
import { Recurso } from '../../recursos/entities/recurso.entity';

@Entity('flashcards')
export class Flashcard {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  anverso: string;

  @Column({ type: 'text' })
  reverso: string;

  @Column({ name: 'competencia_id', type: 'uuid' })
  competenciaId: string;

  @ManyToOne(() => Competencia)
  @JoinColumn({ name: 'competencia_id' })
  competencia?: Competencia;

  @Column({ name: 'recurso_id', type: 'uuid', nullable: true })
  recursoId: string | null;

  @ManyToOne(() => Recurso, { nullable: true })
  @JoinColumn({ name: 'recurso_id' })
  recurso?: Recurso | null;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
