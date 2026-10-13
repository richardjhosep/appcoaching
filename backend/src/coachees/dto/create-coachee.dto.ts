import {
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MinLength,
} from 'class-validator';
import { Moneda } from '../../common/moneda.enum';

export class CreateCoacheeDto {
  @IsString()
  @MinLength(2)
  nombre: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsUUID()
  empresaId?: string;

  @IsOptional()
  @IsString()
  jefeDirecto?: string;

  @IsOptional()
  @IsString()
  objetivoProceso?: string;

  // `IsNumber` (no `IsInt`): en UF el monto es fraccionario (ej. 3.5).
  @IsOptional()
  @IsNumber()
  @Min(1)
  tarifaPropia?: number;

  @IsOptional()
  @IsEnum(Moneda)
  tarifaPropiaMoneda?: Moneda;

  @IsOptional()
  @IsString()
  areaGerencia?: string;

  @IsOptional()
  @IsString()
  cargo?: string;
}
