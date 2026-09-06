import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotaPizarra } from './entities/nota-pizarra.entity';
import { PizarraService } from './pizarra.service';
import { PizarraController } from './pizarra.controller';
import { CoacheesModule } from '../coachees/coachees.module';

@Module({
  imports: [TypeOrmModule.forFeature([NotaPizarra]), CoacheesModule],
  providers: [PizarraService],
  controllers: [PizarraController],
})
export class PizarraModule {}
