import { IsDateString, IsOptional, IsString } from 'class-validator';

export class UpdateSesionDto {
  @IsOptional()
  @IsDateString()
  fechaHora?: string;

  @IsOptional()
  @IsString()
  linkVideollamada?: string;

  @IsOptional()
  @IsString()
  resumenCompartido?: string;

  @IsOptional()
  @IsString()
  notasPrivadas?: string;
}
