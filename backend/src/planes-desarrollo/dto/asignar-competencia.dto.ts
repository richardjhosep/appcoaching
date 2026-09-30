import { IsUUID } from 'class-validator';

export class AsignarCompetenciaDto {
  @IsUUID()
  competenciaId: string;
}
