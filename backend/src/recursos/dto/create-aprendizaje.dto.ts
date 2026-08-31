import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateAprendizajeDto {
  @IsString()
  @MinLength(1)
  contenido: string;

  @IsOptional()
  @IsString()
  aplicacion?: string;
}
