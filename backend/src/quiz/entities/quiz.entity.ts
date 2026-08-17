import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Competencia } from '../../competencias/entities/competencia.entity';
import { Recurso } from '../../recursos/entities/recurso.entity';
import { PreguntaQuiz } from './pregunta-quiz.entity';

@Entity('quizzes')
export class Quiz {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  titulo: string;

  @Column({ name: 'competencia_id', type: 'uuid' })
  competenciaId: string;

  @ManyToOne(() => Competencia)
  @JoinColumn({ name: 'competencia_id' })
  competencia?: Competencia;

  // Material de apoyo opcional de la biblioteca — el quiz no depende de él para
  // nada funcional, es solo una referencia que el coach puede dejar visible.
  @Column({ name: 'recurso_id', type: 'uuid', nullable: true })
  recursoId: string | null;

  @ManyToOne(() => Recurso, { nullable: true })
  @JoinColumn({ name: 'recurso_id' })
  recurso?: Recurso | null;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @OneToMany(() => PreguntaQuiz, (p) => p.quiz)
  preguntas?: PreguntaQuiz[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
