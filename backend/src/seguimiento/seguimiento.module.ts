import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Logro } from './entities/logro.entity';
import { EntradaDiario } from './entities/entrada-diario.entity';
import { AutoevaluacionCompetencia } from './entities/autoevaluacion-competencia.entity';
import { SeguimientoService } from './seguimiento.service';
import { SeguimientoController } from './seguimiento.controller';
import { CoacheesModule } from '../coachees/coachees.module';
import { SesionesModule } from '../sesiones/sesiones.module';
import { CompetenciasModule } from '../competencias/competencias.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Logro, EntradaDiario, AutoevaluacionCompetencia]),
    CoacheesModule,
    SesionesModule,
    CompetenciasModule,
  ],
  providers: [SeguimientoService],
  controllers: [SeguimientoController],
  exports: [SeguimientoService],
})
export class SeguimientoModule {}
