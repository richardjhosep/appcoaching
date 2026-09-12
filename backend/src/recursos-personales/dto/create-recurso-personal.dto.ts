import {
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  MinLength,
} from 'class-validator';
import { CategoriaRecursoPersonal } from '../enums/categoria-recurso-personal.enum';

export class CreateRecursoPersonalDto {
  @IsEnum(CategoriaRecursoPersonal)
  categoria: CategoriaRecursoPersonal;

  @IsString()
  @MinLength(3)
  titulo: string;

  @IsOptional()
  @IsUrl()
  url?: string;

  @IsOptional()
  @IsString()
  notas?: string;
}
