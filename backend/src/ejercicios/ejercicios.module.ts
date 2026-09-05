import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ejercicio } from './entities/ejercicio.entity';
import { VersionEjercicio } from './entities/version-ejercicio.entity';
import { EjerciciosService } from './ejercicios.service';
import { EjerciciosController } from './ejercicios.controller';
import { CoacheesModule } from '../coachees/coachees.module';
import { CompetenciasModule } from '../competencias/competencias.module';
import { PlanesDesarrolloModule } from '../planes-desarrollo/planes-desarrollo.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Ejercicio, VersionEjercicio]),
    CoacheesModule,
    CompetenciasModule,
    PlanesDesarrolloModule,
    AuditModule,
  ],
  providers: [EjerciciosService],
  controllers: [EjerciciosController],
  exports: [EjerciciosService],
})
export class EjerciciosModule {}
