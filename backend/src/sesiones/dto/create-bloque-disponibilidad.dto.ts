import { IsInt, Matches, Max, Min } from 'class-validator';

const HORA_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

export class CreateBloqueDisponibilidadDto {
  @IsInt()
  @Min(0)
  @Max(6)
  diaSemana: number;

  @Matches(HORA_REGEX, {
    message: 'horaInicio debe tener formato HH:MM (24h).',
  })
  horaInicio: string;

  @Matches(HORA_REGEX, { message: 'horaFin debe tener formato HH:MM (24h).' })
  horaFin: string;
}
