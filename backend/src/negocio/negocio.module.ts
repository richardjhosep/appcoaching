import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sesion } from '../sesiones/entities/sesion.entity';
import { PostSesion } from '../sesiones/entities/post-sesion.entity';
import { SolicitudReagendamiento } from '../sesiones/entities/solicitud-reagendamiento.entity';
import { Empresa } from '../empresas/entities/empresa.entity';
import { Coachee } from '../coachees/entities/coachee.entity';
import { Logro } from '../seguimiento/entities/logro.entity';
import { SolicitudProceso } from '../satisfaccion/entities/solicitud-proceso.entity';
import { CicloCoaching } from '../ciclos/entities/ciclo-coaching.entity';
import { NegocioService } from './negocio.service';
import { NegocioController } from './negocio.controller';
import { CiclosModule } from '../ciclos/ciclos.module';
import { SeguimientoModule } from '../seguimiento/seguimiento.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Sesion,
      PostSesion,
      Empresa,
      Coachee,
      Logro,
      SolicitudProceso,
      SolicitudReagendamiento,
      CicloCoaching,
    ]),
    CiclosModule,
    SeguimientoModule,
  ],
  providers: [NegocioService],
  controllers: [NegocioController],
})
export class NegocioModule {}
