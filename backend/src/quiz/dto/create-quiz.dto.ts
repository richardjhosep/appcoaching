import { IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateQuizDto {
  @IsString()
  @MinLength(3)
  titulo: string;

  @IsUUID()
  competenciaId: string;

  @IsOptional()
  @IsUUID()
  recursoId?: string;
}
