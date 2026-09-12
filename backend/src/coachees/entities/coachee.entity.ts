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
import { Moneda } from '../../common/moneda.enum';
import { numericTransformer } from '../../common/numeric-column.transformer';

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

  // `numeric`, mismo criterio que Empresa.tarifaHora: en UF el monto es fraccionario.
  // Solo aplica a un coachee independiente (sin empresa) — irrelevante en `tarifaPropiaMoneda`
  // cuando esto es null.
  @Column({
    name: 'tarifa_propia',
    type: 'numeric',
    precision: 12,
    scale: 2,
    nullable: true,
    transformer: numericTransformer,
  })
  tarifaPropia: number | null;

  @Column({
    name: 'tarifa_propia_moneda',
    type: 'enum',
    enum: Moneda,
    default: Moneda.CLP,
  })
  tarifaPropiaMoneda: Moneda;

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

  // Presentación personal del propio coachee — distinta de `consentimientoInformado`
  // (consentimiento legal del proceso de coaching, aceptado por link de correo). Esto es
  // información que el coachee agrega voluntariamente sobre sí mismo.
  @Column({ name: 'foto_path', type: 'varchar', nullable: true })
  fotoPath: string | null;

  @Column({ name: 'foto_nombre', type: 'varchar', nullable: true })
  fotoNombre: string | null;

  @Column({ type: 'text', nullable: true })
  bio: string | null;

  // Interruptor único (no granular por campo): si es falso, el coach no ve la foto ni la bio
  // en PerfilTab.vue — opt-in, mismo criterio por defecto que consentimientoInformado.
  @Column({
    name: 'compartir_perfil_con_coach',
    type: 'boolean',
    default: false,
  })
  compartirPerfilConCoach: boolean;

  @Column({ name: 'consentimiento_informado', type: 'boolean', default: false })
  consentimientoInformado: boolean;

  @Column({ name: 'consentimiento_fecha', type: 'timestamptz', nullable: true })
  consentimientoFecha: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
