import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Empresa } from './entities/empresa.entity';
import { EmpresasService } from './empresas.service';
import { EmpresasController } from './empresas.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [TypeOrmModule.forFeature([Empresa]), AuditModule],
  providers: [EmpresasService],
  controllers: [EmpresasController],
  exports: [EmpresasService],
})
export class EmpresasModule {}
