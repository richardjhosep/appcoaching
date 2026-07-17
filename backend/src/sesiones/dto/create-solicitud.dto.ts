import { IsOptional, IsString } from 'class-validator';

export class CreateSolicitudDto {
  @IsOptional()
  @IsString()
  motivo?: string;
}
