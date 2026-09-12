import {
  Body,
  Controller,
  Get,
  Post,
  ServiceUnavailableException,
  UseGuards,
} from '@nestjs/common';
import { IndicadoresService } from './indicadores.service';
import { SetUfManualDto } from './dto/set-uf-manual.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('indicadores')
export class IndicadoresController {
  constructor(private readonly indicadores: IndicadoresService) {}

  // Necesario tanto para el coach (mantenedores + panel de negocio) como para la empresa
  // (Finanzas): ambos necesitan el valor UF del día para el selector CLP/UF.
  @Roles(Role.COACH, Role.EMPRESA)
  @Get('uf')
  async ufHoy() {
    const valor = await this.indicadores.getOrFetchHoy();
    if (!valor) {
      throw new ServiceUnavailableException(
        'No hay ningún valor de UF disponible todavía — configura CMF_API_KEY o ingresa el valor manualmente.',
      );
    }
    return valor;
  }

  @Roles(Role.COACH)
  @Post('uf/manual')
  setUfManual(@Body() dto: SetUfManualDto) {
    return this.indicadores.setManualHoy(dto.valorUf);
  }
}
