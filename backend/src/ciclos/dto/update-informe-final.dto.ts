import { IsString } from 'class-validator';

export class UpdateInformeFinalDto {
  @IsString()
  informeFinal: string;
}
