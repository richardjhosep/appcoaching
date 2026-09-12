import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { Moneda } from '../../common/moneda.enum';

export class CreateEmpresaDto {
  @IsString()
  @MinLength(2)
  nombre: string;

  // `IsNumber` (no `IsInt`): en UF el monto es fraccionario (ej. 3.5).
  @IsNumber()
  @Min(1)
  tarifaHora: number;

  @IsOptional()
  @IsEnum(Moneda)
  tarifaHoraMoneda?: Moneda;

  @IsOptional()
  @IsDateString()
  fechaInicio?: string;

  @IsOptional()
  @IsDateString()
  fechaFin?: string;
}
