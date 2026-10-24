import { Injectable } from '@nestjs/common';
import { RedisService } from './redis.service';

// Los access tokens duran minutos; la marca solo necesita vivir un poco más que ellos.
const MARCA_TTL_SEGUNDOS = 60 * 60;

/**
 * Cierra todas las sesiones de un usuario: borra sus refresh tokens y deja una marca de "revocado
 * desde" que JwtStrategy compara con el `iat` de cada access token. Se usa al cambiar o resetear
 * la contraseña, desactivar o eliminar la cuenta — para que un token robado deje de servir.
 */
@Injectable()
export class SessionRevocationService {
  constructor(private readonly redis: RedisService) {}

  async revokeAll(userId: string): Promise<void> {
    await this.redis.deleteByPattern(`refresh:${userId}:*`);
    await this.redis.setWithTtl(
      this.marcaKey(userId),
      String(Math.floor(Date.now() / 1000)),
      MARCA_TTL_SEGUNDOS,
    );
  }

  /** Segundos (epoch) desde los cuales los tokens anteriores quedan inválidos, o null. */
  async revokedAt(userId: string): Promise<number | null> {
    const valor = await this.redis.get(this.marcaKey(userId));
    return valor === null ? null : Number(valor);
  }

  private marcaKey(userId: string): string {
    return `session:revoked-at:${userId}`;
  }
}
