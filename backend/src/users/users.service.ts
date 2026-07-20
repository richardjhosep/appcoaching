import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { User } from './entities/user.entity';
import { Role } from '../auth/enums/role.enum';
import { EmpresasService } from '../empresas/empresas.service';

const TEMP_PASSWORD_LENGTH = 12;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly config: ConfigService,
    private readonly empresas: EmpresasService,
  ) {}

  private generateTempPassword(): string {
    return randomBytes(TEMP_PASSWORD_LENGTH)
      .toString('base64url')
      .slice(0, TEMP_PASSWORD_LENGTH);
  }

  private hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.config.get<number>('bcryptRounds') ?? 12);
  }

  findByEmail(email: string): Promise<User | null> {
    return this.users.findOne({ where: { email } });
  }

  findById(id: string): Promise<User | null> {
    return this.users.findOne({ where: { id } });
  }

  findAll(): Promise<User[]> {
    return this.users.find({
      order: { email: 'ASC' },
      relations: { empresa: true },
    });
  }

  async setActivo(id: string, isActive: boolean): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.isActive = isActive;
    return this.users.save(user);
  }

  hasAnyWithRole(role: Role): Promise<boolean> {
    return this.users.exists({ where: { role } });
  }

  /**
   * Atomic upsert-if-absent for the bootstrap coach seed: several app instances
   * can start concurrently against the same database (e.g. parallel e2e suites),
   * so a check-then-insert on `hasAnyWithRole` would race. `ON CONFLICT (email)
   * DO NOTHING` makes only one insert win regardless of how many instances try.
   */
  async seedCoachIfMissing(email: string, password: string): Promise<boolean> {
    const passwordHash = await this.hash(password);
    const result = await this.users
      .createQueryBuilder()
      .insert()
      .into(User)
      .values({
        email,
        role: Role.COACH,
        passwordHash,
        mustChangePassword: false,
        empresaId: null,
      })
      .orIgnore()
      .execute();
    return result.identifiers.length > 0;
  }

  async createUser(
    email: string,
    role: Role,
    options: {
      password?: string;
      mustChangePassword?: boolean;
      empresaId?: string | null;
    } = {},
  ): Promise<{ user: User; temporaryPassword: string | null }> {
    const existing = await this.findByEmail(email);
    if (existing) {
      throw new ConflictException('A user with that email already exists');
    }

    let empresaId: string | null = null;
    if (role === Role.EMPRESA) {
      if (!options.empresaId) {
        throw new BadRequestException(
          'empresaId is required for the EMPRESA role',
        );
      }
      if (!(await this.empresas.exists(options.empresaId))) {
        throw new NotFoundException('Empresa not found');
      }
      empresaId = options.empresaId;
    }

    const temporaryPassword = options.password ?? this.generateTempPassword();
    const passwordHash = await this.hash(temporaryPassword);

    const user = await this.users.save(
      this.users.create({
        email,
        role,
        passwordHash,
        empresaId,
        mustChangePassword: options.mustChangePassword ?? !options.password,
      }),
    );

    return {
      user,
      temporaryPassword: options.password ? null : temporaryPassword,
    };
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Current password is incorrect');
    }
    user.passwordHash = await this.hash(newPassword);
    user.mustChangePassword = false;
    await this.users.save(user);
  }

  async resetPassword(userId: string): Promise<string> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const temporaryPassword = this.generateTempPassword();
    user.passwordHash = await this.hash(temporaryPassword);
    user.mustChangePassword = true;
    await this.users.save(user);
    return temporaryPassword;
  }

  async remove(id: string, actorId: string): Promise<void> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.id === actorId) {
      throw new ForbiddenException('No puedes eliminar tu propia cuenta.');
    }
    if (user.role === Role.COACHEE) {
      throw new ForbiddenException(
        'Elimina cuentas de coachee desde el Mantenedor de Coachees.',
      );
    }
    await this.users.remove(user);
  }

  /**
   * Deletes a user by id without the actor/role guards from remove(). Used
   * internally by CoacheesService.remove(), which already ran its own
   * pre-delete safety checks; deleting the linked user here cascades (FK
   * ON DELETE CASCADE) to remove the coachee row.
   */
  async removeById(id: string): Promise<void> {
    await this.users.delete(id);
  }
}
