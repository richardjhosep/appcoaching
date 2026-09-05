import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  IsUrl,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { TipoRecurso } from '../enums/tipo-recurso.enum';

export class CreateRecursoDto {
  @IsString()
  @MinLength(1)
  titulo: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsUUID()
  carpetaId: string;

  @IsEnum(TipoRecurso)
  tipo: TipoRecurso;

  @ValidateIf((dto: CreateRecursoDto) => dto.tipo === TipoRecurso.LINK)
  @IsUrl()
  url?: string;

  @IsOptional()
  @IsUUID()
  competenciaId?: string;

  // Fecha simple "YYYY-MM-DD" — el servicio la interpreta como fin de ese día en Chile.
  // Distinto de AsignacionRecurso.expiraEn: acá es cuándo deja de estar disponible el
  // recurso EN GENERAL, no cuándo vence el acceso puntual de un coachee.
  @IsOptional()
  @IsDateString()
  fechaLimite?: string;
}
