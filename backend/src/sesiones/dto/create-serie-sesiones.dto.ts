import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsUUID,
  IsUrl,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import { FrecuenciaSerie } from '../enums/frecuencia-serie.enum';

export class CreateSerieSesionesDto {
  @IsUUID()
  coacheeId: string;

  /** Fecha/hora de la PRIMERA sesión — el resto se genera desde acá según `frecuencia`. */
  @IsDateString()
  fechaHora: string;

  // Un límite razonable (~1 año) evita que un typo (ej. 500) genere una serie gigante
  // por error — no hay caso de uso real por encima de esto.
  @IsInt()
  @Min(2)
  @Max(52)
  cantidadSesiones: number;

  // Opcional para no romper clientes que ya mandaban solo la serie semanal.
  @IsOptional()
  @IsEnum(FrecuenciaSerie)
  frecuencia?: FrecuenciaSerie;

  @ValidateIf(
    (dto: CreateSerieSesionesDto) =>
      dto.frecuencia === FrecuenciaSerie.PERSONALIZADA,
  )
  @IsInt()
  @Min(1)
  @Max(12)
  intervaloSemanas?: number;

  @IsOptional()
  @IsUrl()
  linkVideollamada?: string;
}
