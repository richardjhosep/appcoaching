import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Prospecto } from './entities/prospecto.entity';
import { GestionProspecto } from './entities/gestion-prospecto.entity';
import { ProspectosService } from './prospectos.service';
import { ProspectosController } from './prospectos.controller';
import { EmpresasModule } from '../empresas/empresas.module';
import { CoacheesModule } from '../coachees/coachees.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Prospecto, GestionProspecto]),
    EmpresasModule,
    CoacheesModule,
    AuditModule,
  ],
  providers: [ProspectosService],
  controllers: [ProspectosController],
  exports: [ProspectosService],
})
export class ProspectosModule {}
