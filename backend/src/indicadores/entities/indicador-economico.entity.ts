import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';
import { numericTransformer } from '../../common/numeric-column.transformer';

// Una fila por día calendario (hora de Chile) — caché de lo que la CMF publicó ese día,
// para no golpear su API en cada request. `valorUsd` se guarda para más adelante (no se
// expone todavía a ningún DTO/vista) y puede quedar null los días que la CMF aún no lo
// publica (fines de semana/feriados, a diferencia de la UF que sí trae todos los días
// del mes por adelantado).
@Entity('indicadores_economicos')
export class IndicadorEconomico {
  @PrimaryColumn({ type: 'date' })
  fecha: string;

  @Column({
    name: 'valor_uf',
    type: 'numeric',
    precision: 12,
    scale: 2,
    nullable: true,
    transformer: numericTransformer,
  })
  valorUf: number | null;

  @Column({
    name: 'valor_usd',
    type: 'numeric',
    precision: 12,
    scale: 2,
    nullable: true,
    transformer: numericTransformer,
  })
  valorUsd: number | null;

  // 'cmf' (fetch automático) o 'manual' (el coach lo tipeó a mano — fallback si la CMF
  // está caída o todavía no se configuró CMF_API_KEY).
  @Column({ type: 'varchar', default: 'cmf' })
  fuente: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
