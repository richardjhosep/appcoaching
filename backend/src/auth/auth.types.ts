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
}

export interface RefreshTokenPayload {
  sub: string;
  jti: string;
}
