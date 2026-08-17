import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Coachee } from '../../coachees/entities/coachee.entity';
import { Quiz } from './quiz.entity';

@Entity('intentos_quiz')
export class IntentoQuiz {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'quiz_id', type: 'uuid' })
  quizId: string;

  @ManyToOne(() => Quiz, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'quiz_id' })
  quiz?: Quiz;

  @Column({ name: 'coachee_id', type: 'uuid' })
  coacheeId: string;

  @ManyToOne(() => Coachee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'coachee_id' })
  coachee?: Coachee;

  // Índice de la opción elegida por pregunta, en el mismo orden en que se le
  // mostraron las preguntas al coachee.
  @Column({ type: 'jsonb' })
  respuestas: number[];

  @Column({ type: 'int' })
  puntaje: number;

  // Snapshot al momento de responder: si el coach edita las preguntas del quiz
  // después, este intento histórico no cambia de significado.
  @Column({ name: 'total_preguntas', type: 'int' })
  totalPreguntas: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
