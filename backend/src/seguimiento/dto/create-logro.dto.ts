import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateLogroDto {
  @IsString()
  @MinLength(1)
  fecha: string;

  @IsOptional()
  @IsString()
  situacion?: string;

  @IsString()
  @MinLength(1)
  descripcion: string;
}
