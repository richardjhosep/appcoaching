import { IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateEjercicioDto {
  @IsString()
  @MinLength(3)
  titulo: string;

  @IsString()
  @MinLength(3)
  consigna: string;

  @IsOptional()
  @IsUUID()
  competenciaId?: string;
}
