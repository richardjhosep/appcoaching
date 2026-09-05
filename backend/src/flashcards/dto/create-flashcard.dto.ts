import {
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';

export class CreateFlashcardDto {
  @IsString()
  @MinLength(3)
  anverso: string;

  @IsString()
  @MinLength(1)
  reverso: string;

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
