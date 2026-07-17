import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Competencia } from './entities/competencia.entity';
import { CompetenciasService } from './competencias.service';
import { CompetenciasController } from './competencias.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Competencia])],
  providers: [CompetenciasService],
  controllers: [CompetenciasController],
  exports: [CompetenciasService],
})
export class CompetenciasModule {}
