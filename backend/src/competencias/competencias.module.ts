import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Competencia } from './entities/competencia.entity';
import { EmpresaCompetencia } from '../empresas/entities/empresa-competencia.entity';
import { CompetenciasService } from './competencias.service';
import { CompetenciasController } from './competencias.controller';
import { CoacheesModule } from '../coachees/coachees.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Competencia, EmpresaCompetencia]),
    CoacheesModule,
  ],
  providers: [CompetenciasService],
  controllers: [CompetenciasController],
  exports: [CompetenciasService],
})
export class CompetenciasModule {}
