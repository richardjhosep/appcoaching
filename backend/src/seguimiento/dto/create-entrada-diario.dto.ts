import { IsString, MinLength } from 'class-validator';

export class CreateEntradaDiarioDto {
  @IsString()
  @MinLength(1)
  contenido: string;
}
