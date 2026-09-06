import { IsDateString, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateExperienciaDto {
  @IsString()
  @MinLength(1)
  empresa: string;

  @IsOptional()
  @IsString()
  cargo?: string;

  @IsDateString()
  fechaInicio: string;

  // Sin valor = "actualidad" (trabajo vigente ahí).
  @IsOptional()
  @IsDateString()
  fechaFin?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;
}
