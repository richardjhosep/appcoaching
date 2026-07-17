import { Controller, Get, UseGuards } from '@nestjs/common';
import { CompetenciasService } from './competencias.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('competencias')
export class CompetenciasController {
  constructor(private readonly competencias: CompetenciasService) {}

  @Get()
  findAll() {
    return this.competencias.findAll();
  }
}
