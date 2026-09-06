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
import { Coachee } from '../../coachees/entities/coachee.entity';
import { NodoMapaPersonal } from './nodo-mapa-personal.entity';

// Herramienta de estudio 100% privada del coachee — a diferencia de MapaMental (autoría del
// coach, consumido por el coachee), acá el dueño y único lector es el propio coachee. Sin
// competenciaId/recursoId/fechaLimite/activo: esos son conceptos de contenido asignado que
// no aplican a un mapa personal.
@Entity('mapas_personales')
export class MapaPersonal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'coachee_id', type: 'uuid' })
  coacheeId: string;

  @ManyToOne(() => Coachee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'coachee_id' })
  coachee?: Coachee;

  @Column({ type: 'varchar' })
  titulo: string;

  @OneToMany(() => NodoMapaPersonal, (n) => n.mapa)
  nodos?: NodoMapaPersonal[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
