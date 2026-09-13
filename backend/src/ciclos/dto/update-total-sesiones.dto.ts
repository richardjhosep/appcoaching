import { IsInt, Min } from 'class-validator';

export class UpdateTotalSesionesDto {
  @IsInt()
  @Min(1)
  totalSesiones: number;
}
