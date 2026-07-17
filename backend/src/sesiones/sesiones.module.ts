import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sesion } from './entities/sesion.entity';
import { PostSesion } from './entities/post-sesion.entity';
import { SolicitudReagendamiento } from './entities/solicitud-reagendamiento.entity';
import { CicloCoaching } from '../ciclos/entities/ciclo-coaching.entity';
import { SesionesService } from './sesiones.service';
import { PostSesionesService } from './post-sesiones.service';
import { SesionesController } from './sesiones.controller';
import { SolicitudesReagendamientoService } from './solicitudes-reagendamiento.service';
import { SolicitudesReagendamientoController } from './solicitudes-reagendamiento.controller';
import { CoacheesModule } from '../coachees/coachees.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Sesion,
      PostSesion,
      SolicitudReagendamiento,
      CicloCoaching,
    ]),
    CoacheesModule,
  ],
  providers: [
    SesionesService,
    PostSesionesService,
    SolicitudesReagendamientoService,
  ],
  controllers: [SesionesController, SolicitudesReagendamientoController],
  exports: [
    SesionesService,
    PostSesionesService,
    SolicitudesReagendamientoService,
  ],
})
export class SesionesModule {}
