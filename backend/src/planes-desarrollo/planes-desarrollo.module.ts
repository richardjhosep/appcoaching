import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlanDesarrollo } from './entities/plan-desarrollo.entity';
import { ObjetivoEspecifico } from './entities/objetivo-especifico.entity';
import { ActividadEjecucion } from './entities/actividad-ejecucion.entity';
import { PlanesDesarrolloService } from './planes-desarrollo.service';
import { PlanesDesarrolloController } from './planes-desarrollo.controller';
import { CoacheesModule } from '../coachees/coachees.module';
import { CompetenciasModule } from '../competencias/competencias.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PlanDesarrollo,
      ObjetivoEspecifico,
      ActividadEjecucion,
    ]),
    CoacheesModule,
    CompetenciasModule,
  ],
  providers: [PlanesDesarrolloService],
  controllers: [PlanesDesarrolloController],
  exports: [PlanesDesarrolloService],
})
export class PlanesDesarrolloModule {}
