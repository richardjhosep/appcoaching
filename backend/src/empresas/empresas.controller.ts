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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.COACH)
@Controller('empresas')
export class EmpresasController {
  constructor(
    private readonly empresas: EmpresasService,
    private readonly audit: AuditService,
  ) {}

  @Post()
  create(@Body() dto: CreateEmpresaDto) {
    return this.empresas.create(dto);
  }

  @Get()
  findAll() {
    return this.empresas.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.empresas.findById(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateEmpresaDto) {
    return this.empresas.update(id, dto);
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    await this.empresas.remove(id);
    await this.audit.record('EMPRESA_ELIMINADA', {
      userId: actor.id,
      targetType: 'Empresa',
      targetId: id,
    });
    return { success: true };
  }
}
