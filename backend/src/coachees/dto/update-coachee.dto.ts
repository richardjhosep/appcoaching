import { OmitType, PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsUUID, ValidateIf } from 'class-validator';
import { CreateCoacheeDto } from './create-coachee.dto';

export class UpdateCoacheeDto extends PartialType(
  OmitType(CreateCoacheeDto, ['email', 'empresaId'] as const),
) {
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsUUID()
  empresaId?: string | null;
}
