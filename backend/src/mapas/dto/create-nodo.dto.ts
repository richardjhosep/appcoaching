import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MinLength,
} from 'class-validator';

export class CreateNodoDto {
  @IsString()
  @MinLength(1)
  label: string;

  @IsOptional()
  @IsString()
  detalle?: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  orden?: number;
}
