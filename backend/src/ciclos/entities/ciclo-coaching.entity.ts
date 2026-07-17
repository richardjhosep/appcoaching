import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Coachee } from '../../coachees/entities/coachee.entity';
import { ResultadoCiclo } from '../enums/resultado-ciclo.enum';

@Entity('ciclos_coaching')
export class CicloCoaching {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'coachee_id', type: 'uuid' })
  coacheeId: string;

  @ManyToOne(() => Coachee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'coachee_id' })
  coachee?: Coachee;

  @Column({ name: 'total_sesiones', type: 'int' })
  totalSesiones: number;

  @Column({ name: 'fecha_apertura', type: 'timestamptz' })
  fechaApertura: Date;

  @Column({ name: 'fecha_cierre', type: 'timestamptz', nullable: true })
  fechaCierre: Date | null;

  @Column({ type: 'enum', enum: ResultadoCiclo, nullable: true })
  resultado: ResultadoCiclo | null;

  @Column({ name: 'resumen_reunion_inicial', type: 'text', nullable: true })
  resumenReunionInicial: string | null;

  @Column({ name: 'informe_final', type: 'text', nullable: true })
  informeFinal: string | null;

  @Column({ name: 'informe_pdf_nombre', type: 'varchar', nullable: true })
  informePdfNombre: string | null;

  @Column({ name: 'informe_pdf_path', type: 'varchar', nullable: true })
  informePdfPath: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
