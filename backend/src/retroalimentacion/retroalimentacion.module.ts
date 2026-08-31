import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RetroalimentacionCierre } from './entities/retroalimentacion-cierre.entity';
import { CicloCoaching } from '../ciclos/entities/ciclo-coaching.entity';
import { RetroalimentacionService } from './retroalimentacion.service';
import { RetroalimentacionController } from './retroalimentacion.controller';
import { CoacheesModule } from '../coachees/coachees.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([RetroalimentacionCierre, CicloCoaching]),
    CoacheesModule,
  ],
  providers: [RetroalimentacionService],
  controllers: [RetroalimentacionController],
  exports: [RetroalimentacionService],
})
export class RetroalimentacionModule {}
