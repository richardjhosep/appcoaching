import { IsString, MinLength } from 'class-validator';

export class CreateLogroDto {
  @IsString()
  @MinLength(1)
  fecha: string;

  @IsString()
  @MinLength(1)
  descripcion: string;
}
