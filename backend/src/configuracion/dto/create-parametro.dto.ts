import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateParametroDto {
  @IsString()
  @MinLength(1)
  grupo: string;

  @IsString()
  @MinLength(1)
  clave: string;

  @IsString()
  @MinLength(1)
  valor: string;

  @IsOptional()
  @IsBoolean()
  estado?: boolean;
}
