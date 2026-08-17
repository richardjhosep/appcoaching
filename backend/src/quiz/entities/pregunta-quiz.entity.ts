import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Quiz } from './quiz.entity';

@Entity('preguntas_quiz')
export class PreguntaQuiz {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'quiz_id', type: 'uuid' })
  quizId: string;

  @ManyToOne(() => Quiz, (quiz) => quiz.preguntas, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'quiz_id' })
  quiz?: Quiz;

  @Column({ type: 'text' })
  enunciado: string;

  @Column({ type: 'jsonb' })
  opciones: string[];

  // Nunca debe llegar al coachee antes de que responda — mismo mecanismo que
  // User.passwordHash: el ClassSerializerInterceptor global la oculta sola en
  // cualquier respuesta que devuelva la entidad tal cual. El service arma un
  // objeto plano cuando el coach sí necesita verla/editarla (ver quiz.service.ts).
  @Exclude()
  @Column({ name: 'respuesta_correcta', type: 'int' })
  respuestaCorrecta: number;

  @Column({ type: 'int', default: 1 })
  orden: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
