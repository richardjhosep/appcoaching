import { IsString, MinLength } from 'class-validator';

export class SolicitarCambiosDto {
  @IsString()
  @MinLength(3)
  comentario: string;
}
