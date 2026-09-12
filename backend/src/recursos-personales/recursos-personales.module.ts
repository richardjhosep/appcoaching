import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecursoPersonal } from './entities/recurso-personal.entity';
import { RecursosPersonalesService } from './recursos-personales.service';
import { RecursosPersonalesController } from './recursos-personales.controller';
import { CoacheesModule } from '../coachees/coachees.module';

@Module({
  imports: [TypeOrmModule.forFeature([RecursoPersonal]), CoacheesModule],
  providers: [RecursosPersonalesService],
  controllers: [RecursosPersonalesController],
})
export class RecursosPersonalesModule {}
