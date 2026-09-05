import {
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';

export class CreateEjercicioDto {
  @IsString()
  @MinLength(3)
  titulo: string;

  @IsString()
  @MinLength(3)
  consigna: string;

  @IsOptional()
  @IsUUID()
  competenciaId?: string;

  // Fecha simple "YYYY-MM-DD" — el servicio la interpreta como fin de ese día en Chile.
  @IsOptional()
  @IsDateString()
  fechaLimite?: string;
}
