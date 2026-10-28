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
import { unlink } from 'fs/promises';
import { join } from 'path';
import { UPLOADS_DIR } from '../recursos/uploads-dir.util';
import { Coachee } from './entities/coachee.entity';
import { SolicitudConsentimiento } from './entities/solicitud-consentimiento.entity';
import { EstadoSolicitudConsentimiento } from './enums/estado-solicitud-consentimiento.enum';
import { CreateCoacheeDto } from './dto/create-coachee.dto';
import { UpdateCoacheeDto } from './dto/update-coachee.dto';
import { UpdateMiPerfilDto } from './dto/update-mi-perfil.dto';
import { UsersService } from '../users/users.service';
import { EmpresasService } from '../empresas/empresas.service';
import { EmailService } from '../email/email.service';
import { Role } from '../auth/enums/role.enum';
import type { AuthenticatedUser } from '../auth/auth.types';
import { assignDefined } from '../common/assign-defined.util';
import { Moneda } from '../common/moneda.enum';
import { VERSION_CONSENTIMIENTO_SENSIBLES } from './consentimiento-sensibles';

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
      throw new NotFoundException('Empresa no encontrada.');
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
        tarifaPropiaMoneda: dto.tarifaPropiaMoneda ?? Moneda.CLP,
        areaGerencia: dto.areaGerencia ?? null,
        cargo: dto.cargo ?? null,
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
      throw new NotFoundException('Coachee no encontrado.');
    }
    if (actor.role === Role.EMPRESA && coachee.empresaId !== actor.empresaId) {
      throw new ForbiddenException('No tienes acceso a este coachee.');
    }
    return coachee;
  }

  findByUserId(userId: string): Promise<Coachee | null> {
    return this.coachees.findOne({ where: { userId }, relations: RELATIONS });
  }

  /** Las competencias que prioriza la empresa del coachee — `[]` si es independiente. */
  async getMisCompetenciasEmpresa(userId: string) {
    const coachee = await this.findByUserId(userId);
    if (!coachee?.empresaId) return [];
    return this.empresas.getCompetencias(coachee.empresaId);
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
      throw new NotFoundException('Coachee no encontrado.');
    }
    assignDefined(coachee, dto);
    return this.coachees.save(coachee);
  }

  async setActivo(id: string, activo: boolean): Promise<Coachee> {
    const coachee = await this.coachees.findOne({ where: { id } });
    if (!coachee) {
      throw new NotFoundException('Coachee no encontrado.');
    }
    coachee.activo = activo;
    await this.users.setActivo(coachee.userId, activo);
    return this.coachees.save(coachee);
  }

  async setConsentimiento(id: string, informado: boolean): Promise<Coachee> {
    const coachee = await this.coachees.findOne({ where: { id } });
    if (!coachee) {
      throw new NotFoundException('Coachee no encontrado.');
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
      throw new NotFoundException('Coachee no encontrado.');
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

  /**
   * El coachee acepta su consentimiento informado desde la app, con su sesión iniciada (sin
   * pasar por el enlace del correo). Se deja igualmente una solicitud ACEPTADA como registro
   * de evidencia, igual que en el flujo por correo. Es idempotente: si ya consintió, no hace nada.
   */
  async aceptarMiConsentimiento(userId: string): Promise<Coachee> {
    const coachee = await this.coachees.findOne({ where: { userId } });
    if (!coachee) {
      throw new NotFoundException('Perfil de coachee no encontrado.');
    }
    if (coachee.consentimientoInformado) {
      return coachee;
    }

    const ahora = new Date();
    await this.solicitudes.save(
      this.solicitudes.create({
        coacheeId: coachee.id,
        token: randomBytes(32).toString('base64url'),
        estado: EstadoSolicitudConsentimiento.ACEPTADO,
        expiraEn: ahora,
        respondidoEn: ahora,
      }),
    );

    coachee.consentimientoInformado = true;
    coachee.consentimientoFecha = ahora;
    return this.coachees.save(coachee);
  }

  /**
   * Consentimiento para datos sensibles (Ley 21.719). Es del propio coachee: solo él lo da y lo
   * revoca, desde su sesión. Revocar corta el uso a futuro; lo ya guardado se borra con la
   * supresión de datos (módulo privacidad), no con este interruptor.
   */
  async aceptarMisDatosSensibles(userId: string): Promise<Coachee> {
    const coachee = await this.requireByUserId(userId);
    coachee.consentimientoSensibles = true;
    coachee.consentimientoSensiblesFecha = new Date();
    coachee.consentimientoSensiblesVersion = VERSION_CONSENTIMIENTO_SENSIBLES;
    return this.coachees.save(coachee);
  }

  async revocarMisDatosSensibles(userId: string): Promise<Coachee> {
    const coachee = await this.requireByUserId(userId);
    coachee.consentimientoSensibles = false;
    coachee.consentimientoSensiblesFecha = null;
    coachee.consentimientoSensiblesVersion = null;
    return this.coachees.save(coachee);
  }

  /** Corta una operación que guardaría datos sensibles si el coachee no consintió (o el texto cambió). */
  async exigirConsentimientoSensibles(userId: string): Promise<void> {
    const coachee = await this.requireByUserId(userId);
    if (
      !coachee.consentimientoSensibles ||
      coachee.consentimientoSensiblesVersion !==
        VERSION_CONSENTIMIENTO_SENSIBLES
    ) {
      throw new ForbiddenException(
        'Para usar esta función necesitamos tu consentimiento para tratar datos sensibles. Puedes darlo en Mi cuenta.',
      );
    }
  }

  private async requireByUserId(userId: string): Promise<Coachee> {
    const coachee = await this.coachees.findOne({ where: { userId } });
    if (!coachee) {
      throw new NotFoundException('Perfil de coachee no encontrado.');
    }
    return coachee;
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
      throw new NotFoundException('Coachee no encontrado.');
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

  async actualizarMiPerfil(
    userId: string,
    dto: UpdateMiPerfilDto,
  ): Promise<Coachee> {
    const coachee = await this.coachees.findOne({ where: { userId } });
    if (!coachee) {
      throw new NotFoundException('Perfil de coachee no encontrado.');
    }
    assignDefined(coachee, dto);
    return this.coachees.save(coachee);
  }

  private async borrarArchivoAnterior(path: string | null): Promise<void> {
    if (!path) return;
    await unlink(join(UPLOADS_DIR, path)).catch(() => {
      // Best-effort: si ya no está o falla el borrado, no bloquea el reemplazo.
    });
  }

  async actualizarMiFoto(
    userId: string,
    archivo: Express.Multer.File,
  ): Promise<Coachee> {
    const coachee = await this.coachees.findOne({ where: { userId } });
    if (!coachee) {
      throw new NotFoundException('Perfil de coachee no encontrado.');
    }
    await this.borrarArchivoAnterior(coachee.fotoPath);
    coachee.fotoPath = archivo.filename;
    coachee.fotoNombre = archivo.originalname;
    return this.coachees.save(coachee);
  }
}
