import { ClassSerializerInterceptor, Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { SpanishThrottlerGuard } from './common/spanish-throttler.guard';
import configuration from './config/configuration';
import { validateEnv } from './config/validate-env';
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
import { NegocioModule } from './negocio/negocio.module';
import { LegalModule } from './legal/legal.module';
import { BusquedaModule } from './busqueda/busqueda.module';
import { SatisfaccionModule } from './satisfaccion/satisfaccion.module';
import { NotificacionesModule } from './notificaciones/notificaciones.module';
import { QuizModule } from './quiz/quiz.module';
import { FlashcardsModule } from './flashcards/flashcards.module';
import { MapasModule } from './mapas/mapas.module';
import { MapasPersonalesModule } from './mapas-personales/mapas-personales.module';
import { PizarraModule } from './pizarra/pizarra.module';
import { RetroalimentacionModule } from './retroalimentacion/retroalimentacion.module';
import { EjerciciosModule } from './ejercicios/ejercicios.module';
import { TestEstiloModule } from './test-estilo/test-estilo.module';
import { PerfilCoachModule } from './perfil-coach/perfil-coach.module';
import { ConfiguracionModule } from './configuracion/configuracion.module';
import { ProspectosModule } from './prospectos/prospectos.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: validateEnv,
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
    ProspectosModule,
    SesionesModule,
    CompetenciasModule,
    PlanesDesarrolloModule,
    SeguimientoModule,
    RecursosModule,
    CiclosModule,
    NegocioModule,
    LegalModule,
    BusquedaModule,
    SatisfaccionModule,
    NotificacionesModule,
    QuizModule,
    FlashcardsModule,
    MapasModule,
    MapasPersonalesModule,
    PizarraModule,
    RetroalimentacionModule,
    EjerciciosModule,
    TestEstiloModule,
    PerfilCoachModule,
    ConfiguracionModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: SpanishThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: ClassSerializerInterceptor },
  ],
})
export class AppModule {}
