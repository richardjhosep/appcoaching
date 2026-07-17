import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Logro } from './entities/logro.entity';
import { EntradaDiario } from './entities/entrada-diario.entity';
import { SeguimientoService } from './seguimiento.service';
import { SeguimientoController } from './seguimiento.controller';
import { CoacheesModule } from '../coachees/coachees.module';
import { SesionesModule } from '../sesiones/sesiones.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Logro, EntradaDiario]),
    CoacheesModule,
    SesionesModule,
  ],
  providers: [SeguimientoService],
  controllers: [SeguimientoController],
  exports: [SeguimientoService],
})
export class SeguimientoModule {}
