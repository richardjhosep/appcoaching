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
import { PreguntaEstilo } from './pregunta-estilo.entity';

// "Test de Estilo" — mecánica genérica de opción forzada A/B con perfil por categoría
// (inspirada en el Thomas-Kilmann Conflict Mode Instrument, que el coach mencionó, pero
// SIN sus preguntas reales: es un instrumento comercial con copyright. El coach escribe
// sus propias preguntas/categorías acá — mismo criterio que Quiz/Flashcards/Mapas, donde
// nunca hay contenido precargado, solo la herramienta de autoría).
@Entity('tests_estilo')
export class TestEstilo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  titulo: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string | null;

  @Column({ name: 'competencia_id', type: 'uuid', nullable: true })
  competenciaId: string | null;

  @ManyToOne(() => Competencia, { nullable: true })
  @JoinColumn({ name: 'competencia_id' })
  competencia?: Competencia | null;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  // Opcional — pasada esta fecha (fin del día en horario de Chile), el test deja de
  // aparecer como disponible para el coachee sin que el coach tenga que desactivarlo a mano.
  @Column({ name: 'fecha_limite', type: 'timestamptz', nullable: true })
  fechaLimite: Date | null;

  @OneToMany(() => PreguntaEstilo, (p) => p.testEstilo)
  preguntas?: PreguntaEstilo[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
