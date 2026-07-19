import { IsEmail, IsOptional, Matches } from 'class-validator';

// Valida forma (dígitos, espacios, +, -, paréntesis), no un número realmente
// asignado: `IsPhoneNumber` usa libphonenumber-js/max, que rechaza números
// con formato válido pero fuera de los rangos reales asignados en Chile.
const PHONE_REGEX = /^\+?[0-9\s()-]{7,20}$/;

export class UpdateContactoDto {
  @IsOptional()
  @Matches(PHONE_REGEX, { message: 'telefono must be a valid phone number' })
  telefono?: string;

  @IsOptional()
  @IsEmail()
  emailContacto?: string;
}
