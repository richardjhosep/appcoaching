import {
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { TipoProspecto } from '../enums/tipo-prospecto.enum';

export class CreateProspectoDto {
  @IsString()
  @MinLength(2)
  nombre: string;

  @IsEnum(TipoProspecto)
  tipo: TipoProspecto;

  @IsOptional()
  @IsString()
  contactoNombre?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsOptional()
  @IsString()
  fuente?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  valorEstimado?: number;

  @IsOptional()
  @IsString()
  notas?: string;
}
