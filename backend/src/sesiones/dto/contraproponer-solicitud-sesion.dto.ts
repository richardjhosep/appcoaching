import { IsDateString, IsOptional, IsString, IsUrl } from 'class-validator';

export class ContraproponerSolicitudSesionDto {
  @IsDateString()
  fechaHora: string;

  @IsOptional()
  @IsString()
  respuestaCoach?: string;

  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'] })
  linkVideollamada?: string;
}
