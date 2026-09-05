import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class ResponderSolicitudSesionDto {
  @IsBoolean()
  aprobar: boolean;

  @IsOptional()
  @IsString()
  respuestaCoach?: string;
}
