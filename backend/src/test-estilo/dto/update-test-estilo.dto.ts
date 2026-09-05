import { OmitType, PartialType } from '@nestjs/mapped-types';
import { IsDateString, IsOptional, ValidateIf } from 'class-validator';
import { CreateTestEstiloDto } from './create-test-estilo.dto';

export class UpdateTestEstiloDto extends PartialType(
  OmitType(CreateTestEstiloDto, ['fechaLimite'] as const),
) {
  // Acá además de una fecha o "sin enviar" (sin cambios) se acepta null explícito para
  // quitar la fecha límite ya puesta.
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsDateString()
  fechaLimite?: string | null;
}
