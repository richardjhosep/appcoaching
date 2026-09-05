import {
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class UpdateRecursoDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  titulo?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsUUID()
  carpetaId?: string;

  @IsOptional()
  @IsUUID()
  competenciaId?: string;

  // Acepta null explícito para quitar la fecha límite ya puesta.
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsDateString()
  fechaLimite?: string | null;
}
