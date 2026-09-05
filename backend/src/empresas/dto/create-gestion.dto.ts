import { IsDateString, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateGestionDto {
  @IsString()
  @MinLength(1)
  nota: string;

  @IsOptional()
  @IsDateString()
  proximoSeguimiento?: string;
}
