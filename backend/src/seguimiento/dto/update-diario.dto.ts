import { IsString } from 'class-validator';

export class UpdateDiarioDto {
  @IsString()
  contenido: string;
}
