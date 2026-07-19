import { IsBoolean } from 'class-validator';

export class SetActivoDto {
  @IsBoolean()
  activo: boolean;
}
