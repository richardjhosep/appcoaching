import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdatePostSesionDto {
  @IsOptional()
  @IsString()
  aprendizaje?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  utilidad?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  cercaniaObjetivo?: number;

  @IsOptional()
  @IsString()
  recomendacion?: string;

  @IsOptional()
  @IsString()
  temasProximaSesion?: string;
}
