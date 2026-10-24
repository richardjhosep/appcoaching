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
  @IsUrl({ protocols: ['http', 'https'] })
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

  // Solo tiene efecto junto con `fechaHora` y cuando la sesión pertenece a una serie
  // (recurrenciaId) — aplica el mismo desplazamiento horario a las demás sesiones
  // futuras de esa serie. Ver SesionesService.update().
  @IsOptional()
  @IsBoolean()
  aplicarASerie?: boolean;
}
