import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Coachee } from '../../coachees/entities/coachee.entity';
import { CicloCoaching } from '../../ciclos/entities/ciclo-coaching.entity';

export interface RespuestaRetroalimentacion {
  bloque: string;
  afirmacion: string;
  valor: number;
}

// Pauta real de cierre de proceso que hoy el coach manda a llenar en Word — la llena el
// COACHEE al cerrar su ciclo, distinta de `EncuestaSatisfaccion` (que llena la EMPRESA y
// mide el contrato en general, no un cierre puntual). Un registro por ciclo (unique en cicloId).
@Entity('retroalimentaciones_cierre')
export class RetroalimentacionCierre {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'coachee_id', type: 'uuid' })
  coacheeId: string;

  @ManyToOne(() => Coachee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'coachee_id' })
  coachee?: Coachee;

  @Column({ name: 'ciclo_id', type: 'uuid', unique: true })
  cicloId: string;

  @ManyToOne(() => CicloCoaching, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ciclo_id' })
  ciclo?: CicloCoaching;

  // Las 15 afirmaciones (agrupadas en 3 bloques: Evaluación del Proceso / El Coach /
  // Coordinación de sesiones) son un catálogo fijo que vive en el frontend, no en la base —
  // no cambian por coachee, así que no hace falta modelarlas como filas propias.
  @Column({ type: 'jsonb' })
  respuestas: RespuestaRetroalimentacion[];

  @Column({ name: 'lo_que_mas_gusto', type: 'text', nullable: true })
  loQueMasGusto: string | null;

  @Column({ name: 'mayores_aprendizajes', type: 'text', nullable: true })
  mayoresAprendizajes: string | null;

  @Column({ type: 'text', nullable: true })
  sugerencias: string | null;

  @Column({ name: 'otros_comentarios', type: 'text', nullable: true })
  otrosComentarios: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
