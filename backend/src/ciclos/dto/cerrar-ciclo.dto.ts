import { IsEnum } from 'class-validator';
import { ResultadoCiclo } from '../enums/resultado-ciclo.enum';

export class CerrarCicloDto {
  @IsEnum(ResultadoCiclo)
  resultado: ResultadoCiclo;
}
