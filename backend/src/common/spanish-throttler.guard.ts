import { Injectable } from '@nestjs/common';
import { ThrottlerException, ThrottlerGuard } from '@nestjs/throttler';

// El guard por defecto de @nestjs/throttler lanza "ThrottlerException: Too Many Requests" —
// en inglés y sin traducción posible vía el ValidationPipe (no es un error de validación).
// Se sobreescribe el único punto donde arma la excepción para que el mensaje sea consistente
// con el resto de la API.
@Injectable()
export class SpanishThrottlerGuard extends ThrottlerGuard {
  protected throwThrottlingException(): Promise<void> {
    throw new ThrottlerException(
      'Demasiadas solicitudes. Intenta de nuevo en un momento.',
    );
  }
}
