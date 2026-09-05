import { OmitType, PartialType } from '@nestjs/mapped-types';
import { IsDateString, IsOptional, ValidateIf } from 'class-validator';
import { CreateEjercicioDto } from './create-ejercicio.dto';

export class UpdateEjercicioDto extends PartialType(
  OmitType(CreateEjercicioDto, ['fechaLimite'] as const),
) {
  // Acá además de una fecha o "sin enviar" (sin cambios) se acepta null explícito para
  // quitar la fecha límite ya puesta.
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsDateString()
  fechaLimite?: string | null;
}
