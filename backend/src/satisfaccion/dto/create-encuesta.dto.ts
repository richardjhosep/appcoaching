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

export class RespuestaSatisfaccionDto {
  @IsString()
  @MinLength(1)
  categoria: string;

  @IsInt()
  @Min(1)
  @Max(5)
  valor: number;
}

export class CreateEncuestaDto {
  @IsUUID()
  cicloId: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => RespuestaSatisfaccionDto)
  respuestas: RespuestaSatisfaccionDto[];

  @IsOptional()
  @IsString()
  comentario?: string;
}
