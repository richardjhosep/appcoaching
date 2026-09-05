import { IsDateString, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateCertificacionDto {
  @IsString()
  @MinLength(1)
  nombre: string;

  @IsOptional()
  @IsString()
  entidadEmisora?: string;

  @IsOptional()
  @IsDateString()
  fecha?: string;
}
