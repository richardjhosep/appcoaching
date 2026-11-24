import { IsString, MaxLength } from 'class-validator';

export class UpdateCompromisosDto {
  // Cadena vacía = borrar los compromisos.
  @IsString()
  @MaxLength(5000)
  compromisos: string;
}
