import {
  IsDateString,
  IsInt,
  IsOptional,
  IsUUID,
  IsUrl,
  Max,
  Min,
} from 'class-validator';

export class CreateSerieSesionesDto {
  @IsUUID()
  coacheeId: string;

  /** Fecha/hora de la PRIMERA sesión — el resto se genera semanalmente desde acá. */
  @IsDateString()
  fechaHora: string;

  // Un límite razonable (~1 año) evita que un typo (ej. 500) genere una serie gigante
  // por error — no hay caso de uso real por encima de esto.
  @IsInt()
  @Min(2)
  @Max(52)
  cantidadSesiones: number;

  @IsOptional()
  @IsUrl()
  linkVideollamada?: string;
}
