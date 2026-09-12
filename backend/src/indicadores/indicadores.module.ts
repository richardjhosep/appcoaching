import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IndicadorEconomico } from './entities/indicador-economico.entity';
import { IndicadoresService } from './indicadores.service';
import { IndicadoresController } from './indicadores.controller';

@Module({
  imports: [TypeOrmModule.forFeature([IndicadorEconomico])],
  providers: [IndicadoresService],
  controllers: [IndicadoresController],
  exports: [IndicadoresService],
})
export class IndicadoresModule {}
