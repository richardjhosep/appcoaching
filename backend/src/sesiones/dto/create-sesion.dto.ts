import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateSesionDto {
  @IsUUID()
  coacheeId: string;

  @IsDateString()
  fechaHora: string;

  @IsOptional()
  @IsString()
  linkVideollamada?: string;
}
