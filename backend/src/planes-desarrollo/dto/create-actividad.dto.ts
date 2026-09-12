import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';
import { EstadoActividad } from '../enums/estado-actividad.enum';

export class CreateActividadDto {
  @IsUUID()
  objetivoId: string;

  @IsString()
  @MinLength(3)
  actividad: string;

  @IsOptional()
  @IsDateString()
  fechaInicio?: string;

  @IsOptional()
  @IsDateString()
  fechaFin?: string;

  @IsOptional()
  @IsEnum(EstadoActividad)
  estado?: EstadoActividad;

  @IsOptional()
  @IsString()
  observaciones?: string;
}
