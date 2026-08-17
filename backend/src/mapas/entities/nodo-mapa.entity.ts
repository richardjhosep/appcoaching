import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { MapaMental } from './mapa-mental.entity';

@Entity('nodos_mapa')
export class NodoMapa {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'mapa_id', type: 'uuid' })
  mapaId: string;

  @ManyToOne(() => MapaMental, (m) => m.nodos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'mapa_id' })
  mapa?: MapaMental;

  // Autoreferenciada (mismo patrón que Carpeta.parentId) — nula para el nodo
  // raíz ("el tema") de cada mapa. CASCADE a propósito: borrar un nodo borra
  // toda su subrama, con advertencia explícita en el frontend antes de pedirlo
  // (a diferencia de Carpeta, que bloquea el borrado si tiene contenido — acá
  // un nodo de mapa mental es más "ítem de un esquema" que "carpeta con
  // archivos", así que cascada con aviso previo es el comportamiento esperado).
  @Column({ name: 'parent_id', type: 'uuid', nullable: true })
  parentId: string | null;

  @ManyToOne(() => NodoMapa, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parent_id' })
  parent?: NodoMapa | null;

  @Column({ type: 'varchar' })
  label: string;

  @Column({ type: 'text', nullable: true })
  detalle: string | null;

  @Column({ type: 'int', default: 1 })
  orden: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
