import { IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateCarpetaDto {
  @IsString()
  @MinLength(1)
  nombre: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;
}
