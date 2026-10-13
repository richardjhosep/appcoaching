import { IsBoolean } from 'class-validator';

export class SetTrabajarNivelesDto {
  @IsBoolean()
  trabajarNiveles: boolean;
}
