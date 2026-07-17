import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Coachee } from './entities/coachee.entity';
import { CoacheesService } from './coachees.service';
import { CoacheesController } from './coachees.controller';
import { EmpresasModule } from '../empresas/empresas.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([Coachee]), EmpresasModule, UsersModule],
  providers: [CoacheesService],
  controllers: [CoacheesController],
  exports: [CoacheesService],
})
export class CoacheesModule {}
