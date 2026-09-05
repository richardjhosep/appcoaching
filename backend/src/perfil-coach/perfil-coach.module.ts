import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PerfilCoach } from './entities/perfil-coach.entity';
import { CertificacionCoach } from './entities/certificacion-coach.entity';
import { User } from '../users/entities/user.entity';
import { PerfilCoachService } from './perfil-coach.service';
import { PerfilCoachController } from './perfil-coach.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PerfilCoach, CertificacionCoach, User])],
  providers: [PerfilCoachService],
  controllers: [PerfilCoachController],
})
export class PerfilCoachModule {}
