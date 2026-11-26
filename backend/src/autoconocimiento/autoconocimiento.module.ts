import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeccionAutoconocimientoCoachee } from './entities/seccion-autoconocimiento.entity';
import { AutoconocimientoService } from './autoconocimiento.service';
import { AutoconocimientoController } from './autoconocimiento.controller';
import { CoacheesModule } from '../coachees/coachees.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SeccionAutoconocimientoCoachee]),
    CoacheesModule,
  ],
  providers: [AutoconocimientoService],
  controllers: [AutoconocimientoController],
})
export class AutoconocimientoModule {}
