import { IsDateString, IsOptional, IsUUID, IsUrl } from 'class-validator';

export class CreateSesionDto {
  @IsUUID()
  coacheeId: string;

  @IsDateString()
  fechaHora: string;

  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'] })
  linkVideollamada?: string;
}
