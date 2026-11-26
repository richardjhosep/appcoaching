import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateSeccionDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  contenido?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  complemento?: string;

  @IsOptional()
  @IsBoolean()
  compartida?: boolean;
}
