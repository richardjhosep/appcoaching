import { IsBoolean } from 'class-validator';

export class SetConsentimientoDto {
  @IsBoolean()
  informado: boolean;
}
