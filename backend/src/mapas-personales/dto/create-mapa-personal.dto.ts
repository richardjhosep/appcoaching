import { IsString, MinLength } from 'class-validator';

export class CreateMapaPersonalDto {
  @IsString()
  @MinLength(3)
  titulo: string;
}
