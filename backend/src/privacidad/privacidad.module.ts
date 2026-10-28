import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Coachee } from '../coachees/entities/coachee.entity';
import { User } from '../users/entities/user.entity';
import { UsersModule } from '../users/users.module';
import { AuditModule } from '../audit/audit.module';
import { NotificacionesModule } from '../notificaciones/notificaciones.module';
import { PrivacidadService } from './privacidad.service';
import { PrivacidadController } from './privacidad.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Coachee, User]),
    UsersModule,
    AuditModule,
    NotificacionesModule,
  ],
  providers: [PrivacidadService],
  controllers: [PrivacidadController],
})
export class PrivacidadModule {}
