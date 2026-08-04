import {
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
}
