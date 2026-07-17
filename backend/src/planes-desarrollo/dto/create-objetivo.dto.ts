import { IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreateObjetivoDto {
  @IsString()
  @MinLength(3)
  descripcion: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  orden?: number;
}
