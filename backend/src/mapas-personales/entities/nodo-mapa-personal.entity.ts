import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { MapaPersonal } from './mapa-personal.entity';

@Entity('nodos_mapa_personal')
export class NodoMapaPersonal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'mapa_id', type: 'uuid' })
  mapaId: string;

  @ManyToOne(() => MapaPersonal, (m) => m.nodos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'mapa_id' })
  mapa?: MapaPersonal;

  // Autoreferenciada, mismo criterio que NodoMapa: borrar un nodo borra su subrama completa
  // (CASCADE), con aviso previo en el frontend.
  @Column({ name: 'parent_id', type: 'uuid', nullable: true })
  parentId: string | null;

  @ManyToOne(() => NodoMapaPersonal, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parent_id' })
  parent?: NodoMapaPersonal | null;

  @Column({ type: 'varchar' })
  label: string;

  @Column({ type: 'text', nullable: true })
  detalle: string | null;

  @Column({ type: 'int', default: 1 })
  orden: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
