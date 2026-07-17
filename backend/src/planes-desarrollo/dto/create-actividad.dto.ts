import {
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
  @IsString()
  fechaInicio?: string;

  @IsOptional()
  @IsString()
  fechaFin?: string;

  @IsOptional()
  @IsEnum(EstadoActividad)
  estado?: EstadoActividad;
}
