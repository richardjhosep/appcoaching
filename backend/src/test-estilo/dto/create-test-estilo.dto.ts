import {
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';

export class CreateTestEstiloDto {
  @IsString()
  @MinLength(3)
  titulo: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsUUID()
  competenciaId?: string;

  // Fecha simple "YYYY-MM-DD" — el servicio la interpreta como fin de ese día en Chile.
  @IsOptional()
  @IsDateString()
  fechaLimite?: string;
}
