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
  @IsString()
  temaTratado?: string;

  @IsOptional()
  @IsString()
  ejerciciosAplicados?: string;

  @IsOptional()
  @IsString()
  acuerdos?: string;

  @IsOptional()
  @IsBoolean()
  asistio?: boolean;
}
