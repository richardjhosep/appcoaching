import { IsOptional, IsString } from 'class-validator';

export class MarcarPerdidoDto {
  @IsOptional()
  @IsString()
  motivo?: string;
}
