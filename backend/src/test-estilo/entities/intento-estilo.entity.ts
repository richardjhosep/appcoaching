import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Coachee } from '../../coachees/entities/coachee.entity';
import { TestEstilo } from './test-estilo.entity';

@Entity('intentos_estilo')
export class IntentoEstilo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'test_estilo_id', type: 'uuid' })
  testEstiloId: string;

  @ManyToOne(() => TestEstilo, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'test_estilo_id' })
  testEstilo?: TestEstilo;

  @Column({ name: 'coachee_id', type: 'uuid' })
  coacheeId: string;

  @ManyToOne(() => Coachee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'coachee_id' })
  coachee?: Coachee;

  // 'A' | 'B' elegida por pregunta, en el mismo orden en que se mostraron las preguntas.
  @Column({ type: 'jsonb' })
  respuestas: ('A' | 'B')[];

  // Conteo por categoría, ej. {"Competir": 5, "Colaborar": 8, ...} — snapshot calculado
  // al responder, no se recalcula si el coach edita las preguntas después.
  @Column({ type: 'jsonb' })
  resultado: Record<string, number>;

  // Categoría(s) con más conteo — "A / B" si hay empate.
  @Column({ name: 'categoria_dominante', type: 'varchar' })
  categoriaDominante: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
