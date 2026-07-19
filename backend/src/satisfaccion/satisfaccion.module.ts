import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EncuestaSatisfaccion } from './entities/encuesta-satisfaccion.entity';
import { SolicitudProceso } from './entities/solicitud-proceso.entity';
import { Coachee } from '../coachees/entities/coachee.entity';
import { CicloCoaching } from '../ciclos/entities/ciclo-coaching.entity';
import { Sesion } from '../sesiones/entities/sesion.entity';
import { SatisfaccionService } from './satisfaccion.service';
import { SatisfaccionController } from './satisfaccion.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EncuestaSatisfaccion,
      SolicitudProceso,
      Coachee,
      CicloCoaching,
      Sesion,
    ]),
  ],
  providers: [SatisfaccionService],
  controllers: [SatisfaccionController],
})
export class SatisfaccionModule {}
