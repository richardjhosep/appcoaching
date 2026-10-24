import { Role } from './enums/role.enum';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: Role;
  empresaId: string | null;
  // Solo en una sesión "Ver como": id del superadmin que está mirando. Esa sesión es de
  // solo lectura (JwtStrategy rechaza todo lo que no sea GET).
  impersonadoPor?: string;
}

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: Role;
  empresaId: string | null;
  impersonadoPor?: string;
  // "Must change password": la cuenta aún usa una contraseña temporal. Mientras dure, JwtStrategy
  // solo deja pasar los endpoints necesarios para cambiarla.
  mcp?: boolean;
  // Lo agrega jsonwebtoken al firmar (segundos); se usa para revocar sesiones.
  iat?: number;
}

export interface RefreshTokenPayload {
  sub: string;
  jti: string;
}
