// Política de contraseñas compartida por todos los flujos que fijan una nueva
// (cambio propio, reseteo por token, y en el futuro cualquier otro) — un solo
// lugar para no repetir la regex y el mensaje en cada DTO.
export const PASSWORD_MIN_LENGTH = 12;

export const PASSWORD_COMPLEXITY_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/;

export const PASSWORD_LENGTH_MESSAGE =
  'La contraseña debe tener al menos 12 caracteres.';

export const PASSWORD_COMPLEXITY_MESSAGE =
  'La contraseña debe incluir al menos una mayúscula, una minúscula, un número y un carácter especial.';
