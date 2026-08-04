import { IsBoolean } from 'class-validator';

export class SetPublicaCarpetaDto {
  @IsBoolean()
  publica: boolean;
}
