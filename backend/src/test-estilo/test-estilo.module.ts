import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TestEstilo } from './entities/test-estilo.entity';
import { PreguntaEstilo } from './entities/pregunta-estilo.entity';
import { IntentoEstilo } from './entities/intento-estilo.entity';
import { TestEstiloService } from './test-estilo.service';
import { TestEstiloController } from './test-estilo.controller';
import { CoacheesModule } from '../coachees/coachees.module';
import { CompetenciasModule } from '../competencias/competencias.module';
import { PlanesDesarrolloModule } from '../planes-desarrollo/planes-desarrollo.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TestEstilo, PreguntaEstilo, IntentoEstilo]),
    CoacheesModule,
    CompetenciasModule,
    PlanesDesarrolloModule,
    AuditModule,
  ],
  providers: [TestEstiloService],
  controllers: [TestEstiloController],
  exports: [TestEstiloService],
})
export class TestEstiloModule {}
