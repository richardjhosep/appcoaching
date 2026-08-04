import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { mkdirSync } from 'fs';
import { Recurso } from './entities/recurso.entity';
import { AsignacionRecurso } from './entities/asignacion-recurso.entity';
import { AprendizajeRecurso } from './entities/aprendizaje-recurso.entity';
import { Carpeta } from './entities/carpeta.entity';
import { AsignacionCarpeta } from './entities/asignacion-carpeta.entity';
import { RecursosService } from './recursos.service';
import { AprendizajesRecursoService } from './aprendizajes-recurso.service';
import { CarpetasService } from './carpetas.service';
import { RecursosController } from './recursos.controller';
import { CarpetasController } from './carpetas.controller';
import { UPLOADS_DIR } from './uploads-dir.util';
import { CoacheesModule } from '../coachees/coachees.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Recurso,
      AsignacionRecurso,
      AprendizajeRecurso,
      Carpeta,
      AsignacionCarpeta,
    ]),
    CoacheesModule,
  ],
  providers: [RecursosService, AprendizajesRecursoService, CarpetasService],
  controllers: [RecursosController, CarpetasController],
})
export class RecursosModule implements OnModuleInit {
  onModuleInit() {
    mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}
