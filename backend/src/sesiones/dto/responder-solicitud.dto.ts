import { IsDateString, IsOptional, IsString } from 'class-validator';

export class ResponderSolicitudDto {
  @IsOptional()
  @IsDateString()
  nuevaFechaHora?: string;

  @IsOptional()
  @IsString()
  respuestaCoach?: string;
}
