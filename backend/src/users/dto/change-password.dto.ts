import { IsString, Matches, MinLength } from 'class-validator';

const PASSWORD_COMPLEXITY_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/;

export class ChangePasswordDto {
  @IsString()
  currentPassword: string;

  @IsString()
  @MinLength(12, {
    message: 'La contraseña debe tener al menos 12 caracteres.',
  })
  @Matches(PASSWORD_COMPLEXITY_REGEX, {
    message:
      'La contraseña debe incluir al menos una mayúscula, una minúscula, un número y un carácter especial.',
  })
  newPassword: string;
}
