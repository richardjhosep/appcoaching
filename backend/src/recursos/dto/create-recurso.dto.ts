import {
  IsEnum,
  IsOptional,
  IsString,
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

  @IsOptional()
  @IsString()
  etiquetas?: string;

  @IsEnum(TipoRecurso)
  tipo: TipoRecurso;

  @ValidateIf((dto: CreateRecursoDto) => dto.tipo === TipoRecurso.LINK)
  @IsUrl()
  url?: string;
}
