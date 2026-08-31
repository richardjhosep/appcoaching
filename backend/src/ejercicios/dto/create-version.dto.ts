import { IsString, MinLength } from 'class-validator';

export class CreateVersionDto {
  @IsString()
  @MinLength(1)
  sabe: string;

  @IsString()
  @MinLength(1)
  siente: string;

  @IsString()
  @MinLength(1)
  haga: string;
}
