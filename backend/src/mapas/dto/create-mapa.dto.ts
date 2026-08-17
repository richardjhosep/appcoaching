import { IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateMapaDto {
  @IsString()
  @MinLength(3)
  titulo: string;

  @IsUUID()
  competenciaId: string;

  @IsOptional()
  @IsUUID()
  recursoId?: string;
}
