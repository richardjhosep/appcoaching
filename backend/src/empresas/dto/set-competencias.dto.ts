import { IsArray, IsUUID } from 'class-validator';

export class SetCompetenciasDto {
  @IsArray()
  @IsUUID('4', { each: true })
  competenciaIds: string[];
}
