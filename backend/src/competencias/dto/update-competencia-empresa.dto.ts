import { PartialType } from '@nestjs/mapped-types';
import { CreateCompetenciaEmpresaDto } from './create-competencia-empresa.dto';

export class UpdateCompetenciaEmpresaDto extends PartialType(
  CreateCompetenciaEmpresaDto,
) {}
