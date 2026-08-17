import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Coachee } from '../../coachees/entities/coachee.entity';
import { Flashcard } from './flashcard.entity';

export type ResultadoRepaso = 'facil' | 'dificil' | 'olvidado';

@Entity('repasos_flashcard')
export class RepasoFlashcard {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'flashcard_id', type: 'uuid' })
  flashcardId: string;

  @ManyToOne(() => Flashcard, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'flashcard_id' })
  flashcard?: Flashcard;

  @Column({ name: 'coachee_id', type: 'uuid' })
  coacheeId: string;

  @ManyToOne(() => Coachee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'coachee_id' })
  coachee?: Coachee;

  @Column({ type: 'varchar' })
  resultado: ResultadoRepaso;

  @Column({ name: 'proxima_revision', type: 'date' })
  proximaRevision: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
