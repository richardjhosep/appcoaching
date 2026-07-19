import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Coachee } from './entities/coachee.entity';
import { CreateCoacheeDto } from './dto/create-coachee.dto';
import { UpdateCoacheeDto } from './dto/update-coachee.dto';
import { UpdateContactoDto } from './dto/update-contacto.dto';
import { UsersService } from '../users/users.service';
import { EmpresasService } from '../empresas/empresas.service';
import { Role } from '../auth/enums/role.enum';
import type { AuthenticatedUser } from '../auth/auth.types';
import { assignDefined } from '../common/assign-defined.util';

const RELATIONS = { empresa: true, user: true };

@Injectable()
export class CoacheesService {
  constructor(
    @InjectRepository(Coachee) private readonly coachees: Repository<Coachee>,
    private readonly empresas: EmpresasService,
    private readonly users: UsersService,
  ) {}

  private async assertEmpresaExists(empresaId?: string | null): Promise<void> {
    if (!empresaId) {
      return;
    }
    if (!(await this.empresas.exists(empresaId))) {
      throw new NotFoundException('Empresa not found');
    }
  }

  async create(
    dto: CreateCoacheeDto,
  ): Promise<{ coachee: Coachee; temporaryPassword: string | null }> {
    await this.assertEmpresaExists(dto.empresaId);

    const { user, temporaryPassword } = await this.users.createUser(
      dto.email,
      Role.COACHEE,
    );

    const coachee = await this.coachees.save(
      this.coachees.create({
        nombre: dto.nombre,
        userId: user.id,
        empresaId: dto.empresaId ?? null,
        jefeDirecto: dto.jefeDirecto ?? null,
        objetivoProceso: dto.objetivoProceso ?? null,
        tarifaPropia: dto.tarifaPropia ?? null,
        areaGerencia: dto.areaGerencia ?? null,
      }),
    );

    return { coachee, temporaryPassword };
  }

  findAllForActor(actor: AuthenticatedUser): Promise<Coachee[]> {
    if (actor.role === Role.EMPRESA) {
      if (!actor.empresaId) {
        return Promise.resolve([]);
      }
      return this.coachees.find({
        where: { empresaId: actor.empresaId },
        relations: RELATIONS,
      });
    }
    return this.coachees.find({ relations: RELATIONS });
  }

  async findOneForActor(
    id: string,
    actor: AuthenticatedUser,
  ): Promise<Coachee> {
    const coachee = await this.coachees.findOne({
      where: { id },
      relations: RELATIONS,
    });
    if (!coachee) {
      throw new NotFoundException('Coachee not found');
    }
    if (actor.role === Role.EMPRESA && coachee.empresaId !== actor.empresaId) {
      throw new ForbiddenException();
    }
    return coachee;
  }

  findByUserId(userId: string): Promise<Coachee | null> {
    return this.coachees.findOne({ where: { userId }, relations: RELATIONS });
  }

  exists(id: string): Promise<boolean> {
    return this.coachees.exists({ where: { id } });
  }

  async update(id: string, dto: UpdateCoacheeDto): Promise<Coachee> {
    if (dto.empresaId !== undefined) {
      await this.assertEmpresaExists(dto.empresaId);
    }
    const coachee = await this.coachees.findOne({ where: { id } });
    if (!coachee) {
      throw new NotFoundException('Coachee not found');
    }
    assignDefined(coachee, dto);
    return this.coachees.save(coachee);
  }

  async setConsentimiento(id: string, informado: boolean): Promise<Coachee> {
    const coachee = await this.coachees.findOne({ where: { id } });
    if (!coachee) {
      throw new NotFoundException('Coachee not found');
    }
    coachee.consentimientoInformado = informado;
    coachee.consentimientoFecha = informado ? new Date() : null;
    return this.coachees.save(coachee);
  }

  async updateOwnContact(
    userId: string,
    dto: UpdateContactoDto,
  ): Promise<Coachee> {
    const coachee = await this.coachees.findOne({ where: { userId } });
    if (!coachee) {
      throw new NotFoundException('Coachee profile not found');
    }
    assignDefined(coachee, dto);
    return this.coachees.save(coachee);
  }
}
