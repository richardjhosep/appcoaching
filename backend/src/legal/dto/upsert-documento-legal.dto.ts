import { IsDateString, IsEnum, IsOptional } from 'class-validator';
import { EstadoDocumentoLegal } from '../enums/estado-documento-legal.enum';

export class UpsertDocumentoLegalDto {
  @IsEnum(EstadoDocumentoLegal)
  estado: EstadoDocumentoLegal;

  @IsOptional()
  @IsDateString()
  fecha?: string;

  @IsOptional()
  @IsDateString()
  vigencia?: string;
}
