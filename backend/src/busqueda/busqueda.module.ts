import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Coachee } from '../coachees/entities/coachee.entity';
import { Empresa } from '../empresas/entities/empresa.entity';
import { Competencia } from '../competencias/entities/competencia.entity';
import { Recurso } from '../recursos/entities/recurso.entity';
import { BusquedaService } from './busqueda.service';
import { BusquedaController } from './busqueda.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Coachee, Empresa, Competencia, Recurso])],
  providers: [BusquedaService],
  controllers: [BusquedaController],
})
export class BusquedaModule {}
