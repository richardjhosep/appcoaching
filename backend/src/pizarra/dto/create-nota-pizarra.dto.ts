import { IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateNotaPizarraDto {
  @IsInt()
  posX: number;

  @IsInt()
  posY: number;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  texto?: string;
}
