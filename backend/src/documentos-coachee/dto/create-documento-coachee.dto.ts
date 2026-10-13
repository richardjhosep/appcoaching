import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { TipoDocumentoCoachee } from '../enums/tipo-documento-coachee.enum';

export class CreateDocumentoCoacheeDto {
  @IsEnum(TipoDocumentoCoachee)
  tipo: TipoDocumentoCoachee;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  descripcion?: string;
}
