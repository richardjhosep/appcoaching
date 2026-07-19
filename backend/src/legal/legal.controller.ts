import {
  Body,
  Controller,
  Get,
  Param,
  ParseEnumPipe,
  Put,
  UseGuards,
} from '@nestjs/common';
import { LegalService } from './legal.service';
import { UpsertDocumentoLegalDto } from './dto/upsert-documento-legal.dto';
import { TipoDocumentoLegal } from './enums/tipo-documento-legal.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('legal')
export class LegalController {
  constructor(private readonly legal: LegalService) {}

  @Roles(Role.COACH)
  @Get('resumen')
  resumen() {
    return this.legal.resumen();
  }

  @Roles(Role.COACH)
  @Get('cumplimiento')
  cumplimiento() {
    return this.legal.cumplimiento();
  }

  @Roles(Role.COACH)
  @Put('documentos/:empresaId/:tipo')
  upsertDocumento(
    @Param('empresaId') empresaId: string,
    @Param('tipo', new ParseEnumPipe(TipoDocumentoLegal))
    tipo: TipoDocumentoLegal,
    @Body() dto: UpsertDocumentoLegalDto,
  ) {
    return this.legal.upsertDocumento(empresaId, tipo, dto);
  }
}
