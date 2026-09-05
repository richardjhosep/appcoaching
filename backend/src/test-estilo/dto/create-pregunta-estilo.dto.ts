import { IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreatePreguntaEstiloDto {
  @IsString()
  @MinLength(1)
  opcionA: string;

  @IsString()
  @MinLength(1)
  categoriaA: string;

  @IsString()
  @MinLength(1)
  opcionB: string;

  @IsString()
  @MinLength(1)
  categoriaB: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  orden?: number;
}
