import { IsEmail, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { Role } from '../../auth/enums/role.enum';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsEnum(Role)
  role: Role;

  @IsOptional()
  @IsUUID()
  empresaId?: string;
}
