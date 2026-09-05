import { PartialType } from '@nestjs/mapped-types';
import { CreatePreguntaEstiloDto } from './create-pregunta-estilo.dto';

export class UpdatePreguntaEstiloDto extends PartialType(
  CreatePreguntaEstiloDto,
) {}
