import {
  IsBoolean,
  IsDateString,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';

export class UpdateSesionDto {
  @IsOptional()
  @IsDateString()
  fechaHora?: string;

  @IsOptional()
  @IsUrl()
  linkVideollamada?: string;

  @IsOptional()
  @IsString()
  resumenCompartido?: string;

  @IsOptional()
  @IsString()
  notasPrivadas?: string;

  @IsOptional()
  @IsBoolean()
  asistio?: boolean;
}
