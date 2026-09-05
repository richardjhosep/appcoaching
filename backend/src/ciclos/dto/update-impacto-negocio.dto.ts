import { IsString } from 'class-validator';

export class UpdateImpactoNegocioDto {
  @IsString()
  impactoNegocio: string;
}
