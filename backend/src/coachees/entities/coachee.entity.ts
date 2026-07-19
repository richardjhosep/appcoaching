import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Empresa } from '../../empresas/entities/empresa.entity';

@Entity('coachees')
export class Coachee {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nombre: string;

  @Column({ name: 'user_id', type: 'uuid', unique: true })
  userId: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @Column({ name: 'empresa_id', type: 'uuid', nullable: true })
  empresaId: string | null;

  @ManyToOne(() => Empresa, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'empresa_id' })
  empresa?: Empresa | null;

  @Column({ name: 'tarifa_propia', type: 'integer', nullable: true })
  tarifaPropia: number | null;

  @Column({ name: 'jefe_directo', type: 'varchar', nullable: true })
  jefeDirecto: string | null;

  @Column({ name: 'objetivo_proceso', type: 'text', nullable: true })
  objetivoProceso: string | null;

  @Column({ type: 'varchar', nullable: true })
  telefono: string | null;

  @Column({ name: 'email_contacto', type: 'varchar', nullable: true })
  emailContacto: string | null;

  @Column({ name: 'area_gerencia', type: 'varchar', nullable: true })
  areaGerencia: string | null;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @Column({ name: 'consentimiento_informado', type: 'boolean', default: false })
  consentimientoInformado: boolean;

  @Column({ name: 'consentimiento_fecha', type: 'timestamptz', nullable: true })
  consentimientoFecha: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
