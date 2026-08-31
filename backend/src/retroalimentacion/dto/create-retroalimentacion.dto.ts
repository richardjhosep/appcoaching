import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class RespuestaRetroalimentacionDto {
  @IsString()
  @MinLength(1)
  bloque: string;

  @IsString()
  @MinLength(1)
  afirmacion: string;

  @IsInt()
  @Min(1)
  @Max(5)
  valor: number;
}

export class CreateRetroalimentacionDto {
  @IsUUID()
  cicloId: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => RespuestaRetroalimentacionDto)
  respuestas: RespuestaRetroalimentacionDto[];

  @IsOptional()
  @IsString()
  loQueMasGusto?: string;

  @IsOptional()
  @IsString()
  mayoresAprendizajes?: string;

  @IsOptional()
  @IsString()
  sugerencias?: string;

  @IsOptional()
  @IsString()
  otrosComentarios?: string;
}
