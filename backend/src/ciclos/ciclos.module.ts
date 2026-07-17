import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CicloCoaching } from './entities/ciclo-coaching.entity';
import { Sesion } from '../sesiones/entities/sesion.entity';
import { CiclosService } from './ciclos.service';
import { CiclosController } from './ciclos.controller';
import { CoacheesModule } from '../coachees/coachees.module';
import { PlanesDesarrolloModule } from '../planes-desarrollo/planes-desarrollo.module';
import { SeguimientoModule } from '../seguimiento/seguimiento.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CicloCoaching, Sesion]),
    CoacheesModule,
    PlanesDesarrolloModule,
    SeguimientoModule,
  ],
  providers: [CiclosService],
  controllers: [CiclosController],
})
export class CiclosModule {}
