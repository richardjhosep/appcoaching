import {
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MinLength,
} from 'class-validator';

export class CreateCoacheeDto {
  @IsString()
  @MinLength(2)
  nombre: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsUUID()
  empresaId?: string;

  @IsOptional()
  @IsString()
  jefeDirecto?: string;

  @IsOptional()
  @IsString()
  objetivoProceso?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  tarifaPropia?: number;

  @IsOptional()
  @IsString()
  areaGerencia?: string;
}
