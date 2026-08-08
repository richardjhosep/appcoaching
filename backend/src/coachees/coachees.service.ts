import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import { Coachee } from './entities/coachee.entity';
import { SolicitudConsentimiento } from './entities/solicitud-consentimiento.entity';
import { EstadoSolicitudConsentimiento } from './enums/estado-solicitud-consentimiento.enum';
import { CreateCoacheeDto } from './dto/create-coachee.dto';
import { UpdateCoacheeDto } from './dto/update-coachee.dto';
import { UpdateContactoDto } from './dto/update-contacto.dto';
import { UsersService } from '../users/users.service';
import { EmpresasService } from '../empresas/empresas.service';
import { EmailService } from '../email/email.service';
import { Role } from '../auth/enums/role.enum';
import type { AuthenticatedUser } from '../auth/auth.types';
import { assignDefined } from '../common/assign-defined.util';

const RELATIONS = { empresa: true, user: true };
const SOLICITUD_CONSENTIMIENTO_TTL_DIAS = 7;

@Injectable()
export class CoacheesService {
  constructor(
    @InjectRepository(Coachee) private readonly coachees: Repository<Coachee>,
    @InjectRepository(SolicitudConsentimiento)
    private readonly solicitudes: Repository<SolicitudConsentimiento>,
    private readonly empresas: EmpresasService,
    private readonly users: UsersService,
    private readonly email: EmailService,
    private readonly config: ConfigService,
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
      { nombre: dto.nombre },
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

  async setActivo(id: string, activo: boolean): Promise<Coachee> {
    const coachee = await this.coachees.findOne({ where: { id } });
    if (!coachee) {
      throw new NotFoundException('Coachee not found');
    }
    coachee.activo = activo;
    await this.users.setActivo(coachee.userId, activo);
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

  /**
   * Envía al propio coachee un correo con un link único para que confirme su
   * consentimiento informado — a diferencia de setConsentimiento(), que es el
   * coach declarándolo a mano, acá es el coachee mismo quien deja la evidencia.
   */
  async solicitarConsentimiento(id: string): Promise<void> {
    const coachee = await this.coachees.findOne({
      where: { id },
      relations: { user: true },
    });
    if (!coachee) {
      throw new NotFoundException('Coachee not found');
    }

    const token = randomBytes(32).toString('base64url');
    const expiraEn = new Date(
      Date.now() + SOLICITUD_CONSENTIMIENTO_TTL_DIAS * 24 * 60 * 60 * 1000,
    );
    await this.solicitudes.save(
      this.solicitudes.create({ coacheeId: coachee.id, token, expiraEn }),
    );

    const destinatario = coachee.emailContacto ?? coachee.user?.email;
    if (destinatario) {
      const verUrl = `${this.config.get<string>('frontendUrl')}/consentimiento/${token}`;
      void this.email.sendSolicitudConsentimiento({
        to: destinatario,
        nombreCoachee: coachee.nombre,
        verUrl,
      });
    }
  }

  async obtenerSolicitudPorToken(
    token: string,
  ): Promise<{ solicitud: SolicitudConsentimiento; coachee: Coachee }> {
    const solicitud = await this.solicitudes.findOne({
      where: { token },
      relations: { coachee: true },
    });
    if (!solicitud?.coachee) {
      throw new NotFoundException('Solicitud no encontrada.');
    }
    return { solicitud, coachee: solicitud.coachee };
  }

  async responderSolicitud(token: string, aceptado: boolean): Promise<Coachee> {
    const { solicitud, coachee } = await this.obtenerSolicitudPorToken(token);

    if (solicitud.estado !== EstadoSolicitudConsentimiento.PENDIENTE) {
      throw new BadRequestException('Esta solicitud ya fue respondida.');
    }
    if (solicitud.expiraEn.getTime() < Date.now()) {
      throw new BadRequestException(
        'Este enlace ya venció. Pide a tu coach que te envíe uno nuevo.',
      );
    }

    solicitud.estado = aceptado
      ? EstadoSolicitudConsentimiento.ACEPTADO
      : EstadoSolicitudConsentimiento.RECHAZADO;
    solicitud.respondidoEn = new Date();
    await this.solicitudes.save(solicitud);

    coachee.consentimientoInformado = aceptado;
    coachee.consentimientoFecha = aceptado ? new Date() : null;
    return this.coachees.save(coachee);
  }

  async remove(id: string): Promise<string> {
    const coachee = await this.coachees.findOne({ where: { id } });
    if (!coachee) {
      throw new NotFoundException('Coachee not found');
    }
    const [{ total }] = await this.coachees.manager.query<[{ total: number }]>(
      `SELECT (
        (SELECT COUNT(*) FROM sesiones WHERE coachee_id = $1) +
        (SELECT COUNT(*) FROM ciclos_coaching WHERE coachee_id = $1) +
        (SELECT COUNT(*) FROM planes_desarrollo WHERE coachee_id = $1) +
        (SELECT COUNT(*) FROM entradas_diario WHERE coachee_id = $1) +
        (SELECT COUNT(*) FROM logros WHERE coachee_id = $1) +
        (SELECT COUNT(*) FROM asignaciones_recurso WHERE coachee_id = $1) +
        (SELECT COUNT(*) FROM aprendizajes_recurso WHERE coachee_id = $1)
      )::int AS total`,
      [id],
    );
    if (total > 0) {
      throw new ConflictException(
        'No se puede eliminar: el coachee ya tiene historial registrado (sesiones, planes, ciclos, etc.). Usa "Desactivar" en su lugar.',
      );
    }
    await this.users.removeById(coachee.userId);
    return coachee.nombre;
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
