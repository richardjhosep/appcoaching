import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateParametroDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  grupo?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  clave?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  valor?: string;

  @IsOptional()
  @IsBoolean()
  estado?: boolean;
}
