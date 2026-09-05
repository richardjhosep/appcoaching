import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MapaMental } from './entities/mapa-mental.entity';
import { NodoMapa } from './entities/nodo-mapa.entity';
import { Recurso } from '../recursos/entities/recurso.entity';
import { MapasService } from './mapas.service';
import { MapasController } from './mapas.controller';
import { CompetenciasModule } from '../competencias/competencias.module';
import { CoacheesModule } from '../coachees/coachees.module';
import { PlanesDesarrolloModule } from '../planes-desarrollo/planes-desarrollo.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    // Recurso registrado también acá solo para validar recursoId — mismo
    // motivo que en quiz.module.ts / flashcards.module.ts.
    TypeOrmModule.forFeature([MapaMental, NodoMapa, Recurso]),
    CompetenciasModule,
    CoacheesModule,
    PlanesDesarrolloModule,
    AuditModule,
  ],
  providers: [MapasService],
  controllers: [MapasController],
  exports: [MapasService],
})
export class MapasModule {}
