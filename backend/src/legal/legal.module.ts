import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentoLegal } from './entities/documento-legal.entity';
import { DocumentoAdicionalLegal } from './entities/documento-adicional-legal.entity';
import { Empresa } from '../empresas/entities/empresa.entity';
import { Coachee } from '../coachees/entities/coachee.entity';
import { LegalService } from './legal.service';
import { LegalController } from './legal.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DocumentoLegal,
      DocumentoAdicionalLegal,
      Empresa,
      Coachee,
    ]),
    AuditModule,
  ],
  providers: [LegalService],
  controllers: [LegalController],
})
export class LegalModule {}
