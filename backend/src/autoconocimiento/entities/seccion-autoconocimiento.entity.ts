import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Coachee } from '../../coachees/entities/coachee.entity';
import { SeccionAutoconocimiento } from '../enums/seccion-autoconocimiento.enum';

// Una fila por sección escrita del "Mi perfil" del coachee. Nace privada: el coach solo la ve
// mientras `compartida` esté activa (cada sección se comparte por separado).
@Entity('secciones_autoconocimiento')
@Unique('UQ_secciones_autoconocimiento_coachee_seccion', [
  'coacheeId',
  'seccion',
])
export class SeccionAutoconocimientoCoachee {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'coachee_id', type: 'uuid' })
  coacheeId: string;

  @ManyToOne(() => Coachee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'coachee_id' })
  coachee?: Coachee;

  @Column({ type: 'varchar' })
  seccion: SeccionAutoconocimiento;

  @Column({ type: 'text', default: '' })
  contenido: string;

  // Segunda columna de "Lo que me da energía / lo que me la quita"; vacía en las demás.
  @Column({ type: 'text', default: '' })
  complemento: string;

  @Column({ type: 'boolean', default: false })
  compartida: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
