import {
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';

export class CreateMapaDto {
  @IsString()
  @MinLength(3)
  titulo: string;

  @IsUUID()
  competenciaId: string;

  @IsOptional()
  @IsUUID()
  recursoId?: string;

  // Fecha simple "YYYY-MM-DD" — el servicio la interpreta como fin de ese día en Chile.
  @IsOptional()
  @IsDateString()
  fechaLimite?: string;
}
