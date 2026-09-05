import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

// Tabla genérica de parametrización — para catálogos de valores fijos que hoy viven
// hardcodeados en código (el primer caso real: las preguntas de retroalimentación de cierre,
// antes en `frontend/src/lib/retroalimentacionPreguntas.ts`) y que el coach quiere poder editar
// sin depender de un deploy. `grupo` agrupa entradas relacionadas (ej. el nombre de un bloque
// de preguntas, o el índice de bloques de un catálogo); `clave` identifica la entrada dentro
// del grupo (típicamente el orden, como string, para que el ORDER BY clave alcance); `valor` es
// el contenido en sí; `estado` permite desactivar una entrada sin borrarla — las respuestas ya
// guardadas citan el texto literal de `valor`, no un id, así que desactivar acá nunca reescribe
// historial.
@Entity('parametros_configuracion')
@Index(['grupo', 'clave'], { unique: true })
export class ParametroConfiguracion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  grupo: string;

  @Column()
  clave: string;

  @Column({ type: 'text' })
  valor: string;

  @Column({ default: true })
  estado: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
