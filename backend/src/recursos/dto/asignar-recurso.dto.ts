import { IsBoolean } from 'class-validator';

export class AsignarRecursoDto {
  @IsBoolean()
  activa: boolean;
}
