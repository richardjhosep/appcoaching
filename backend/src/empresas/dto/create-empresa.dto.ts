import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class CreateEmpresaDto {
  @IsString()
  @MinLength(2)
  nombre: string;

  @IsInt()
  @Min(1)
  tarifaHora: number;

  @IsOptional()
  @IsDateString()
  fechaInicio?: string;

  @IsOptional()
  @IsDateString()
  fechaFin?: string;
}
