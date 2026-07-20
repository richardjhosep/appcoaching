import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Coachee } from './entities/coachee.entity';
import { CoacheesService } from './coachees.service';
import { CoacheesController } from './coachees.controller';
import { EmpresasModule } from '../empresas/empresas.module';
import { UsersModule } from '../users/users.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Coachee]),
    EmpresasModule,
    UsersModule,
    AuditModule,
  ],
  providers: [CoacheesService],
  controllers: [CoacheesController],
  exports: [CoacheesService],
})
export class CoacheesModule {}
