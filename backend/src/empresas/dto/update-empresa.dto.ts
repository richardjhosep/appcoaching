import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';
import { CreateEmpresaDto } from './create-empresa.dto';

export class UpdateEmpresaDto extends PartialType(CreateEmpresaDto) {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  pagada?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  horasContratadas?: number;
}
