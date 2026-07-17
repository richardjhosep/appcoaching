import { ClassSerializerInterceptor, Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import configuration from './config/configuration';
import { HealthModule } from './health/health.module';
import { RedisModule } from './redis/redis.module';
import { UsersModule } from './users/users.module';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { SeedModule } from './seed/seed.module';
import { EmpresasModule } from './empresas/empresas.module';
import { CoacheesModule } from './coachees/coachees.module';
import { SesionesModule } from './sesiones/sesiones.module';
import { CompetenciasModule } from './competencias/competencias.module';
import { PlanesDesarrolloModule } from './planes-desarrollo/planes-desarrollo.module';
import { SeguimientoModule } from './seguimiento/seguimiento.module';
import { RecursosModule } from './recursos/recursos.module';
import { CiclosModule } from './ciclos/ciclos.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 20 }]),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('database.host'),
        port: config.get<number>('database.port'),
        username: config.get<string>('database.user'),
        password: config.get<string>('database.password'),
        database: config.get<string>('database.name'),
        synchronize: false,
        autoLoadEntities: true,
      }),
    }),
    HealthModule,
    RedisModule,
    UsersModule,
    AuditModule,
    AuthModule,
    SeedModule,
    EmpresasModule,
    CoacheesModule,
    SesionesModule,
    CompetenciasModule,
    PlanesDesarrolloModule,
    SeguimientoModule,
    RecursosModule,
    CiclosModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: ClassSerializerInterceptor },
  ],
})
export class AppModule {}
