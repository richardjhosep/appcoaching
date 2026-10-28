import { IsString, MinLength } from 'class-validator';

export class SuprimirCoacheeDto {
  /** El coach escribe el nombre del coachee: confirmación explícita de una acción irreversible. */
  @IsString()
  @MinLength(1)
  confirmarNombre: string;
}
