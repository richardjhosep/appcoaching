import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { NivelCompetenciaDto } from './nivel-competencia.dto';

export class CreateCompetenciaEmpresaDto {
  @IsString()
  @MinLength(1)
  nombre: string;

  @IsString()
  @MinLength(1)
  definicion: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => NivelCompetenciaDto)
  niveles: NivelCompetenciaDto[];
}
