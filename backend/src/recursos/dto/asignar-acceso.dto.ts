import { IsBoolean, IsISO8601, IsOptional } from 'class-validator';

export class AsignarAccesoDto {
  @IsBoolean()
  activa: boolean;

  @IsOptional()
  @IsISO8601()
  expiraEn?: string;
}
