import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

// Valida forma (dígitos, espacios, +, -, paréntesis), no un número realmente
// asignado: `IsPhoneNumber` usa libphonenumber-js/max, que rechaza números
// con formato válido pero fuera de los rangos reales asignados en Chile.
const PHONE_REGEX = /^\+?[0-9\s()-]{7,20}$/;

export class UpdateMiPerfilDto {
  @IsOptional()
  @Matches(PHONE_REGEX, { message: 'El teléfono no tiene un formato válido.' })
  telefono?: string;

  @IsOptional()
  @IsEmail()
  emailContacto?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  bio?: string;

  @IsOptional()
  @IsBoolean()
  compartirPerfilConCoach?: boolean;
}
