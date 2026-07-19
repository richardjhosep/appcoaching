import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { AuditService } from '../audit/audit.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { SetActivoDto } from './dto/set-activo.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '../auth/enums/role.enum';
import type { AuthenticatedUser } from '../auth/auth.types';

@Controller('users')
export class UsersController {
  constructor(
    private readonly users: UsersService,
    private readonly audit: AuditService,
  ) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.COACH)
  @Post()
  async create(
    @Body() dto: CreateUserDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    const { user, temporaryPassword } = await this.users.createUser(
      dto.email,
      dto.role,
      { empresaId: dto.empresaId },
    );
    await this.audit.record('USER_CREATED', {
      userId: actor.id,
      targetType: 'User',
      targetId: user.id,
      metadata: { email: user.email, role: user.role },
    });
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      temporaryPassword,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.COACH)
  @Get()
  findAll() {
    return this.users.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me/password')
  async changeOwnPassword(
    @Body() dto: ChangePasswordDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    await this.users.changePassword(
      actor.id,
      dto.currentPassword,
      dto.newPassword,
    );
    await this.audit.record('PASSWORD_CHANGED', {
      userId: actor.id,
      targetType: 'User',
      targetId: actor.id,
    });
    return { success: true };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.COACH)
  @Patch(':id/estado')
  async setActivo(
    @Param('id') id: string,
    @Body() dto: SetActivoDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    const user = await this.users.setActivo(id, dto.isActive);
    await this.audit.record(
      dto.isActive ? 'USER_ACTIVADO' : 'USER_DESACTIVADO',
      {
        userId: actor.id,
        targetType: 'User',
        targetId: id,
      },
    );
    return user;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.COACH)
  @Post(':id/reset-password')
  async resetPassword(
    @Param('id') id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    const temporaryPassword = await this.users.resetPassword(id);
    await this.audit.record('PASSWORD_RESET', {
      userId: actor.id,
      targetType: 'User',
      targetId: id,
    });
    return { temporaryPassword };
  }
}
