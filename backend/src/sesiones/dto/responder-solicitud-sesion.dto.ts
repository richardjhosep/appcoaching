import { IsBoolean, IsOptional, IsString, IsUrl } from 'class-validator';

export class ResponderSolicitudSesionDto {
  @IsBoolean()
  aprobar: boolean;

  @IsOptional()
  @IsString()
  respuestaCoach?: string;

  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'] })
  linkVideollamada?: string;
}
