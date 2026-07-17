import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateRecursoDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  titulo?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsString()
  etiquetas?: string;
}
