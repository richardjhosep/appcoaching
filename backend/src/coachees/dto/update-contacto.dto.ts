import { IsOptional, IsString } from 'class-validator';

export class UpdateContactoDto {
  @IsOptional()
  @IsString()
  telefono?: string;

  @IsOptional()
  @IsString()
  emailContacto?: string;
}
