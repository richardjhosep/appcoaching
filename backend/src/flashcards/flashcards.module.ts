import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Flashcard } from './entities/flashcard.entity';
import { RepasoFlashcard } from './entities/repaso-flashcard.entity';
import { Recurso } from '../recursos/entities/recurso.entity';
import { FlashcardsService } from './flashcards.service';
import { FlashcardsController } from './flashcards.controller';
import { CoacheesModule } from '../coachees/coachees.module';
import { CompetenciasModule } from '../competencias/competencias.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    // Recurso registrado también acá solo para validar recursoId — mismo
    // motivo que en quiz.module.ts.
    TypeOrmModule.forFeature([Flashcard, RepasoFlashcard, Recurso]),
    CoacheesModule,
    CompetenciasModule,
    AuditModule,
  ],
  providers: [FlashcardsService],
  controllers: [FlashcardsController],
  exports: [FlashcardsService],
})
export class FlashcardsModule {}
