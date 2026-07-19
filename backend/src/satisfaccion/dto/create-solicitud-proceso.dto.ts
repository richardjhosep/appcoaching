import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateSolicitudProcesoDto {
  @IsString()
  @MinLength(2)
  nombreSugerido: string;

  @IsOptional()
  @IsString()
  mensaje?: string;
}
