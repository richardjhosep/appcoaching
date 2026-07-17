import { IsString } from 'class-validator';

export class UpdateResumenDto {
  @IsString()
  resumenReunionInicial: string;
}
