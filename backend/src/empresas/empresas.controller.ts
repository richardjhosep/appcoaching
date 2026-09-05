import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { EmpresasService } from './empresas.service';
import { AuditService } from '../audit/audit.service';
import { CreateEmpresaDto } from './dto/create-empresa.dto';
import { UpdateEmpresaDto } from './dto/update-empresa.dto';
import { CreateGestionDto } from './dto/create-gestion.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('empresas')
export class EmpresasController {
  constructor(
    private readonly empresas: EmpresasService,
    private readonly audit: AuditService,
  ) {}

  @Roles(Role.COACH)
  @Post()
  create(@Body() dto: CreateEmpresaDto) {
    return this.empresas.create(dto);
  }

  @Roles(Role.COACH)
  @Get()
  findAll() {
    return this.empresas.findAll();
  }

  // Declarada antes de ':id' — si no, Nest la matchea contra la ruta con parámetro.
  @Roles(Role.EMPRESA)
  @Get('me')
  findOwn(@CurrentUser() actor: AuthenticatedUser) {
    return this.empresas.findById(actor.empresaId ?? '');
  }

  @Roles(Role.COACH)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.empresas.findById(id);
  }

  @Roles(Role.COACH)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateEmpresaDto) {
    return this.empresas.update(id, dto);
  }

  @Roles(Role.COACH)
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    const nombre = await this.empresas.remove(id);
    await this.audit.record('EMPRESA_ELIMINADA', {
      userId: actor.id,
      targetType: 'Empresa',
      targetId: id,
      targetLabel: nombre,
    });
    return { success: true };
  }

  @Roles(Role.COACH)
  @Post(':id/gestion')
  crearGestion(@Param('id') id: string, @Body() dto: CreateGestionDto) {
    return this.empresas.crearGestion(id, dto);
  }

  @Roles(Role.COACH)
  @Get(':id/gestion')
  listGestion(@Param('id') id: string) {
    return this.empresas.listGestionDeEmpresa(id);
  }
}
