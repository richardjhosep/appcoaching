import { OmitType, PartialType } from '@nestjs/mapped-types';
import { IsDateString, IsOptional, ValidateIf } from 'class-validator';
import { CreateQuizDto } from './create-quiz.dto';

export class UpdateQuizDto extends PartialType(
  OmitType(CreateQuizDto, ['fechaLimite'] as const),
) {
  // Acá además de una fecha o "sin enviar" (sin cambios) se acepta null explícito para
  // quitar la fecha límite ya puesta.
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsDateString()
  fechaLimite?: string | null;
}
