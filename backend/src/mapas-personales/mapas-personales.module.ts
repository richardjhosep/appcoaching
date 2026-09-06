import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MapaPersonal } from './entities/mapa-personal.entity';
import { NodoMapaPersonal } from './entities/nodo-mapa-personal.entity';
import { MapasPersonalesService } from './mapas-personales.service';
import { MapasPersonalesController } from './mapas-personales.controller';
import { CoacheesModule } from '../coachees/coachees.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([MapaPersonal, NodoMapaPersonal]),
    CoacheesModule,
  ],
  providers: [MapasPersonalesService],
  controllers: [MapasPersonalesController],
})
export class MapasPersonalesModule {}
