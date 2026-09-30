import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class NivelCompetenciaDto {
  @IsInt()
  @Min(1)
  nivel: number;

  @IsString()
  @MinLength(1)
  descripcion: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  comportamientos?: string[];
}
