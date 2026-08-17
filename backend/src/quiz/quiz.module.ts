import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Quiz } from './entities/quiz.entity';
import { PreguntaQuiz } from './entities/pregunta-quiz.entity';
import { IntentoQuiz } from './entities/intento-quiz.entity';
import { Recurso } from '../recursos/entities/recurso.entity';
import { QuizService } from './quiz.service';
import { QuizController } from './quiz.controller';
import { CoacheesModule } from '../coachees/coachees.module';
import { CompetenciasModule } from '../competencias/competencias.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    // Recurso se registra también acá (además de en RecursosModule) solo para
    // poder validar `recursoId` con un Repository propio — RecursosModule no
    // exporta RecursosService, y agregarlo no aporta nada más que esta
    // verificación de existencia. TypeORM permite registrar la misma entidad
    // en varios módulos sin conflicto.
    TypeOrmModule.forFeature([Quiz, PreguntaQuiz, IntentoQuiz, Recurso]),
    CoacheesModule,
    CompetenciasModule,
    AuditModule,
  ],
  providers: [QuizService],
  controllers: [QuizController],
  exports: [QuizService],
})
export class QuizModule {}
