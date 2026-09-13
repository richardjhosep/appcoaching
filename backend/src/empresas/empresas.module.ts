import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Empresa } from './entities/empresa.entity';
import { GestionRenovacion } from './entities/gestion-renovacion.entity';
import { EmpresaCompetencia } from './entities/empresa-competencia.entity';
import { EmpresasService } from './empresas.service';
import { EmpresasController } from './empresas.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Empresa, GestionRenovacion, EmpresaCompetencia]),
    AuditModule,
  ],
  providers: [EmpresasService],
  controllers: [EmpresasController],
  exports: [EmpresasService],
})
export class EmpresasModule {}
