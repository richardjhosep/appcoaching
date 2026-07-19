import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentoLegal } from './entities/documento-legal.entity';
import { Empresa } from '../empresas/entities/empresa.entity';
import { Coachee } from '../coachees/entities/coachee.entity';
import { LegalService } from './legal.service';
import { LegalController } from './legal.controller';

@Module({
  imports: [TypeOrmModule.forFeature([DocumentoLegal, Empresa, Coachee])],
  providers: [LegalService],
  controllers: [LegalController],
})
export class LegalModule {}
