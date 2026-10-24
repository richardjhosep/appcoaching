import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { spanishValidationExceptionFactory } from './common/validation-exception-factory';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);

  // Detrás de nginx (y del túnel de cloudflared) req.ip sería siempre la IP del proxy, así que
  // el límite de peticiones (throttler) se compartiría entre TODOS los usuarios. Se confía en
  // los saltos de red privada (loopback, red de Docker, LAN) y se toma como cliente la primera
  // IP no privada de X-Forwarded-For contando desde la derecha: un X-Forwarded-For falsificado
  // por el cliente queda a la izquierda de lo que añade nginx y no se usa.
  app.set('trust proxy', 'loopback, linklocal, uniquelocal');

  app.use(helmet());
  app.enableCors({
    origin: config.get<string>('frontendUrl'),
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: spanishValidationExceptionFactory,
    }),
  );

  await app.listen(config.get<number>('port') ?? 3000);
}
void bootstrap();
