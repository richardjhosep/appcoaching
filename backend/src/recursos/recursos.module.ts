import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { mkdirSync } from 'fs';
import { Recurso } from './entities/recurso.entity';
import { AsignacionRecurso } from './entities/asignacion-recurso.entity';
import { AprendizajeRecurso } from './entities/aprendizaje-recurso.entity';
import { RecursosService } from './recursos.service';
import { AprendizajesRecursoService } from './aprendizajes-recurso.service';
import { RecursosController } from './recursos.controller';
import { UPLOADS_DIR } from './uploads-dir.util';
import { CoacheesModule } from '../coachees/coachees.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Recurso, AsignacionRecurso, AprendizajeRecurso]),
    CoacheesModule,
  ],
  providers: [RecursosService, AprendizajesRecursoService],
  controllers: [RecursosController],
})
export class RecursosModule implements OnModuleInit {
  onModuleInit() {
    mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}
