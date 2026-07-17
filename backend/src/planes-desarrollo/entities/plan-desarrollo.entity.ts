import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Coachee } from '../../coachees/entities/coachee.entity';
import { Competencia } from '../../competencias/entities/competencia.entity';
import { ObjetivoEspecifico } from './objetivo-especifico.entity';
import { ActividadEjecucion } from './actividad-ejecucion.entity';
import { EstadoPlan } from '../enums/estado-plan.enum';

@Entity('planes_desarrollo')
export class PlanDesarrollo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'coachee_id', type: 'uuid', unique: true })
  coacheeId: string;

  @OneToOne(() => Coachee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'coachee_id' })
  coachee?: Coachee;

  @Column({ name: 'competencia_id', type: 'uuid', nullable: true })
  competenciaId: string | null;

  @ManyToOne(() => Competencia, { nullable: true })
  @JoinColumn({ name: 'competencia_id' })
  competencia?: Competencia | null;

  @Column({ name: 'nivel_actual', type: 'int', nullable: true })
  nivelActual: number | null;

  @Column({ name: 'nivel_objetivo', type: 'int', nullable: true })
  nivelObjetivo: number | null;

  @Column({ type: 'varchar', nullable: true })
  plazo: string | null;

  @Column({ name: 'descripcion_estado_actual', type: 'text', nullable: true })
  descripcionEstadoActual: string | null;

  @Column({ name: 'objetivo_general', type: 'text', nullable: true })
  objetivoGeneral: string | null;

  @Column({ type: 'enum', enum: EstadoPlan, default: EstadoPlan.SIN_ENVIAR })
  estado: EstadoPlan;

  @Column({ name: 'comentario_coach', type: 'text', nullable: true })
  comentarioCoach: string | null;

  // Hábito a incorporar o cambiar — siempre de libre edición, nunca se bloquea.
  @Column({ name: 'habito_cuando', type: 'text', nullable: true })
  habitoCuando: string | null;

  @Column({ name: 'habito_en_vez_de', type: 'text', nullable: true })
  habitoEnVezDe: string | null;

  @Column({ name: 'habito_voy_a', type: 'text', nullable: true })
  habitoVoyA: string | null;

  @Column({ name: 'habito_obvio', type: 'text', nullable: true })
  habitoObvio: string | null;

  @Column({ name: 'habito_sencillo', type: 'text', nullable: true })
  habitoSencillo: string | null;

  @Column({ name: 'habito_atractivo', type: 'text', nullable: true })
  habitoAtractivo: string | null;

  @Column({ name: 'habito_satisfactorio', type: 'text', nullable: true })
  habitoSatisfactorio: string | null;

  // Plan de formación — también de libre edición.
  @Column({ name: 'formacion_libros', type: 'text', nullable: true })
  formacionLibros: string | null;

  @Column({ name: 'formacion_articulos', type: 'text', nullable: true })
  formacionArticulos: string | null;

  @Column({ name: 'formacion_videos', type: 'text', nullable: true })
  formacionVideos: string | null;

  @Column({ name: 'formacion_podcasts', type: 'text', nullable: true })
  formacionPodcasts: string | null;

  @Column({ name: 'formacion_practica_guiada', type: 'text', nullable: true })
  formacionPracticaGuiada: string | null;

  @OneToMany(() => ObjetivoEspecifico, (o) => o.plan)
  objetivos?: ObjetivoEspecifico[];

  @OneToMany(() => ActividadEjecucion, (a) => a.plan)
  actividades?: ActividadEjecucion[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
