import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sesion } from './entities/sesion.entity';
import { PostSesion } from './entities/post-sesion.entity';
import { SolicitudReagendamiento } from './entities/solicitud-reagendamiento.entity';
import { DisponibilidadCoach } from './entities/disponibilidad-coach.entity';
import { SolicitudSesion } from './entities/solicitud-sesion.entity';
import { CicloCoaching } from '../ciclos/entities/ciclo-coaching.entity';
import { SesionesService } from './sesiones.service';
import { PostSesionesService } from './post-sesiones.service';
import { SesionesController } from './sesiones.controller';
import { SolicitudesReagendamientoService } from './solicitudes-reagendamiento.service';
import { SolicitudesReagendamientoController } from './solicitudes-reagendamiento.controller';
import { DisponibilidadService } from './disponibilidad.service';
import { DisponibilidadController } from './disponibilidad.controller';
import { SolicitudesSesionService } from './solicitudes-sesion.service';
import { SolicitudesSesionController } from './solicitudes-sesion.controller';
import { CoacheesModule } from '../coachees/coachees.module';
import { UsersModule } from '../users/users.module';
import { NotificacionesModule } from '../notificaciones/notificaciones.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Sesion,
      PostSesion,
      SolicitudReagendamiento,
      DisponibilidadCoach,
      SolicitudSesion,
      CicloCoaching,
    ]),
    CoacheesModule,
    UsersModule,
    NotificacionesModule,
    EmailModule,
  ],
  providers: [
    SesionesService,
    PostSesionesService,
    SolicitudesReagendamientoService,
    DisponibilidadService,
    SolicitudesSesionService,
  ],
  controllers: [
    SesionesController,
    SolicitudesReagendamientoController,
    DisponibilidadController,
    SolicitudesSesionController,
  ],
  exports: [
    SesionesService,
    PostSesionesService,
    SolicitudesReagendamientoService,
    DisponibilidadService,
    SolicitudesSesionService,
  ],
})
export class SesionesModule {}
