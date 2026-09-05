import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { TestEstilo } from './test-estilo.entity';

@Entity('preguntas_estilo')
export class PreguntaEstilo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'test_estilo_id', type: 'uuid' })
  testEstiloId: string;

  @ManyToOne(() => TestEstilo, (t) => t.preguntas, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'test_estilo_id' })
  testEstilo?: TestEstilo;

  @Column({ name: 'opcion_a', type: 'text' })
  opcionA: string;

  // Oculta al coachee antes de responder (mismo mecanismo que
  // PreguntaQuiz.respuestaCorrecta) — mostrar la categoría de antemano sesga la
  // respuesta de un instrumento de autopercepción de estilo.
  @Exclude()
  @Column({ name: 'categoria_a', type: 'varchar' })
  categoriaA: string;

  @Column({ name: 'opcion_b', type: 'text' })
  opcionB: string;

  @Exclude()
  @Column({ name: 'categoria_b', type: 'varchar' })
  categoriaB: string;

  @Column({ type: 'int', default: 1 })
  orden: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
