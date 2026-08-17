import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class CreatePreguntaDto {
  @IsString()
  @MinLength(3)
  enunciado: string;

  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(6)
  @IsString({ each: true })
  opciones: string[];

  // Validado además contra opciones.length en el service (class-validator no
  // valida bien entre dos campos del mismo DTO sin un validador custom aparte).
  @IsInt()
  @Min(0)
  respuestaCorrecta: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  orden?: number;
}
