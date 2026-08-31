import { IsBoolean } from 'class-validator';

export class SetActivoDto {
  @IsBoolean()
  isActive: boolean;
}
