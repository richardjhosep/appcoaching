import { IsString, MinLength } from 'class-validator';

export class UpdateCarpetaDto {
  @IsString()
  @MinLength(1)
  nombre: string;
}
