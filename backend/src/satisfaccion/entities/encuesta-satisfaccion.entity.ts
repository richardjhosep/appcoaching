import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Empresa } from '../../empresas/entities/empresa.entity';
import { CicloCoaching } from '../../ciclos/entities/ciclo-coaching.entity';

export interface RespuestaSatisfaccion {
  categoria: string;
  valor: number;
}

@Entity('encuestas_satisfaccion')
export class EncuestaSatisfaccion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'empresa_id', type: 'uuid' })
  empresaId: string;

  @ManyToOne(() => Empresa, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'empresa_id' })
  empresa?: Empresa;

  // Nullable + único: encuestas nuevas siempre van ligadas a un ciclo cerrado puntual (una por
  // ciclo — el mismo mecanismo resuelve "ligar a un proceso" y "limitar la frecuencia" a la
  // vez); las filas viejas sin ciclo (de antes de este cambio) quedan con cicloId null, y
  // Postgres no las considera duplicadas entre sí bajo un unique constraint.
  @Column({ name: 'ciclo_id', type: 'uuid', nullable: true, unique: true })
  cicloId: string | null;

  @ManyToOne(() => CicloCoaching, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ciclo_id' })
  ciclo?: CicloCoaching;

  // Detalle por categoría (ver `parametros_configuracion`, grupo SATISFACCION_CATEGORIAS) —
  // null en las encuestas viejas, que solo tenían la nota general.
  @Column({ type: 'jsonb', nullable: true })
  respuestas: RespuestaSatisfaccion[] | null;

  // Derivada del promedio de `respuestas` cuando existen (ver `SatisfaccionService.crearEncuesta`)
  // — se mantiene como columna propia para no tocar el cálculo de KPI (`AVG(calificacion)`).
  @Column({ type: 'int' })
  calificacion: number;

  @Column({ type: 'text', nullable: true })
  comentario: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
