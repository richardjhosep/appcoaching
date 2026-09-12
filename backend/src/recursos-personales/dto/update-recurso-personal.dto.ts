import { PartialType } from '@nestjs/mapped-types';
import { CreateRecursoPersonalDto } from './create-recurso-personal.dto';

export class UpdateRecursoPersonalDto extends PartialType(
  CreateRecursoPersonalDto,
) {}
