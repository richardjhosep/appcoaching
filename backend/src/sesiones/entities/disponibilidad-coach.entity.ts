import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

// Bloques semanales recurrentes de disponibilidad del coach. Sin coachId: la app es
// mono-coach (ninguna otra entidad de sesiones/ciclos lo tiene tampoco). El coach puede
// definir varios bloques por día (ej. 09:00-13:00 y 15:00-18:00).
@Entity('disponibilidad_coach')
export class DisponibilidadCoach {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Convención Date.getDay(): 0=domingo..6=sábado.
  @Column({ name: 'dia_semana', type: 'int' })
  diaSemana: number;

  @Column({ name: 'hora_inicio', type: 'varchar', length: 5 })
  horaInicio: string;

  @Column({ name: 'hora_fin', type: 'varchar', length: 5 })
  horaFin: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
