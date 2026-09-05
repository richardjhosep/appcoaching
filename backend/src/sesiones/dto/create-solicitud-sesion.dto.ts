import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateSolicitudSesionDto {
  @IsDateString()
  fechaHoraPropuesta: string;

  @IsOptional()
  @IsString()
  motivo?: string;
}
