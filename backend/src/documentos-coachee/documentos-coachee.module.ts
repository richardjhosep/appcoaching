import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentoCoachee } from './entities/documento-coachee.entity';
import { DocumentosCoacheeService } from './documentos-coachee.service';
import { DocumentosCoacheeController } from './documentos-coachee.controller';
import { CoacheesModule } from '../coachees/coachees.module';

@Module({
  imports: [TypeOrmModule.forFeature([DocumentoCoachee]), CoacheesModule],
  providers: [DocumentosCoacheeService],
  controllers: [DocumentosCoacheeController],
})
export class DocumentosCoacheeModule {}
