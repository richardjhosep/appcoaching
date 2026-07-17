import { IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class AbrirCicloDto {
  @IsUUID()
  coacheeId: string;

  @IsInt()
  @Min(1)
  totalSesiones: number;

  @IsOptional()
  @IsString()
  resumenReunionInicial?: string;
}
