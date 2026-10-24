import { IsOptional, IsString, IsUrl, MinLength } from 'class-validator';

export class UpdatePerfilCoachDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  nombre?: string;

  @IsOptional()
  @IsString()
  titulo?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'] })
  linkedinUrl?: string;

  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'] })
  sitioWeb?: string;

  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'] })
  instagramUrl?: string;

  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'] })
  facebookUrl?: string;

  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'] })
  youtubeUrl?: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsOptional()
  @IsString()
  emailContacto?: string;

  @IsOptional()
  @IsString()
  metodologia?: string;
}
