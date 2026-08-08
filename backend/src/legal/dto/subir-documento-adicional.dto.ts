import { IsString, MinLength } from 'class-validator';

export class SubirDocumentoAdicionalDto {
  @IsString()
  @MinLength(1)
  titulo: string;
}
