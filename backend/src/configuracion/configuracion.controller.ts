import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ConfiguracionService } from './configuracion.service';
import { CreateParametroDto } from './dto/create-parametro.dto';
import { UpdateParametroDto } from './dto/update-parametro.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('configuracion')
export class ConfiguracionController {
  constructor(private readonly configuracion: ConfiguracionService) {}

  // Rutas literales declaradas antes que cualquier eventual ':id' — mismo criterio de siempre.
  @Roles(Role.COACH, Role.COACHEE)
  @Get('retroalimentacion/preguntas')
  preguntasRetroalimentacion() {
    return this.configuracion.listarPreguntasRetroalimentacion();
  }

  @Roles(Role.COACH, Role.EMPRESA)
  @Get('satisfaccion/categorias')
  categoriasSatisfaccion() {
    return this.configuracion.listarCategoriasSatisfaccion();
  }

  @Roles(Role.COACH)
  @Get()
  listar(@Query('grupo') grupo?: string) {
    return this.configuracion.listar(grupo);
  }

  @Roles(Role.COACH)
  @Post()
  crear(@Body() dto: CreateParametroDto) {
    return this.configuracion.crear(dto);
  }

  @Roles(Role.COACH)
  @Patch(':id')
  actualizar(@Param('id') id: string, @Body() dto: UpdateParametroDto) {
    return this.configuracion.actualizar(id, dto);
  }

  @Roles(Role.COACH)
  @Delete(':id')
  eliminar(@Param('id') id: string) {
    return this.configuracion.eliminar(id);
  }
}
