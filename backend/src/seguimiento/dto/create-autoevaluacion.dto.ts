import { IsInt, IsString, IsUUID, Min, MinLength } from 'class-validator';

export class CreateAutoevaluacionDto {
  @IsUUID()
  competenciaId: string;

  @IsInt()
  @Min(1)
  nivel: number;

  @IsString()
  @MinLength(1)
  ejemplo: string;
}
