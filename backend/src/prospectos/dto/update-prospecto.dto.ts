import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional } from 'class-validator';
import { CreateProspectoDto } from './create-prospecto.dto';
import { EtapaProspecto } from '../enums/etapa-prospecto.enum';

export class UpdateProspectoDto extends PartialType(CreateProspectoDto) {
  @IsOptional()
  @IsEnum(EtapaProspecto)
  etapa?: EtapaProspecto;
}
