import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TipoProspecto } from '../enums/tipo-prospecto.enum';
import { EtapaProspecto } from '../enums/etapa-prospecto.enum';

// Negocio todavía no firmado: contactos y oportunidades comerciales antes de convertirse en
// Empresa o Coachee reales. A diferencia de esos dos, un Prospecto nunca crea un User — no
// necesita acceso al sistema hasta que se gana. `convertidoEmpresaId`/`convertidoCoacheeId`
// trazan a qué registro real dio origen este prospecto una vez ganado.
@Entity('prospectos')
export class Prospecto {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nombre: string;

  @Column({ type: 'enum', enum: TipoProspecto })
  tipo: TipoProspecto;

  @Column({ name: 'contacto_nombre', type: 'varchar', nullable: true })
  contactoNombre: string | null;

  @Column({ type: 'varchar', nullable: true })
  email: string | null;

  @Column({ type: 'varchar', nullable: true })
  telefono: string | null;

  @Column({ type: 'varchar', nullable: true })
  fuente: string | null;

  @Column({ name: 'valor_estimado', type: 'integer', nullable: true })
  valorEstimado: number | null;

  @Column({
    type: 'enum',
    enum: EtapaProspecto,
    default: EtapaProspecto.CONTACTADO,
  })
  etapa: EtapaProspecto;

  @Column({ type: 'text', nullable: true })
  notas: string | null;

  @Column({ name: 'convertido_empresa_id', type: 'uuid', nullable: true })
  convertidoEmpresaId: string | null;

  @Column({ name: 'convertido_coachee_id', type: 'uuid', nullable: true })
  convertidoCoacheeId: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
