import { Role } from './enums/role.enum';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: Role;
  empresaId: string | null;
}

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: Role;
  empresaId: string | null;
}

export interface RefreshTokenPayload {
  sub: string;
  jti: string;
}
