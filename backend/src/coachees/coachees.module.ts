import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Coachee } from './entities/coachee.entity';
import { SolicitudConsentimiento } from './entities/solicitud-consentimiento.entity';
import { CoacheesService } from './coachees.service';
import { CoacheesController } from './coachees.controller';
import { ConsentimientoController } from './consentimiento.controller';
import { EmpresasModule } from '../empresas/empresas.module';
import { UsersModule } from '../users/users.module';
import { AuditModule } from '../audit/audit.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Coachee, SolicitudConsentimiento]),
    EmpresasModule,
    UsersModule,
    AuditModule,
    EmailModule,
  ],
  providers: [CoacheesService],
  controllers: [CoacheesController, ConsentimientoController],
  exports: [CoacheesService],
})
export class CoacheesModule {}
