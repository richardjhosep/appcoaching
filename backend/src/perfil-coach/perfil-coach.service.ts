import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { PerfilCoach } from './entities/perfil-coach.entity';
import { CertificacionCoach } from './entities/certificacion-coach.entity';
import { User } from '../users/entities/user.entity';
import { Role } from '../auth/enums/role.enum';
import { UpdatePerfilCoachDto } from './dto/update-perfil-coach.dto';
import { CreateCertificacionDto } from './dto/create-certificacion.dto';
import { UPLOADS_DIR } from '../recursos/uploads-dir.util';
import { assignDefined } from '../common/assign-defined.util';

@Injectable()
export class PerfilCoachService {
  constructor(
    @InjectRepository(PerfilCoach)
    private readonly perfiles: Repository<PerfilCoach>,
    @InjectRepository(CertificacionCoach)
    private readonly certificaciones: Repository<CertificacionCoach>,
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  // Como PlanDesarrollo: la fila 1-a-1 se crea vacía en el primer acceso, en vez de que el
  // coach vea un 404 antes de haber guardado nada.
  async obtenerOCrearPropio(coachUserId: string): Promise<PerfilCoach> {
    const existente = await this.perfiles.findOne({
      where: { coachUserId },
      relations: { certificaciones: true },
    });
    if (existente) return existente;
    return this.perfiles.save(
      this.perfiles.create({ coachUserId, nombre: '' }),
    );
  }

  // Para coachee/empresa: hoy hay un solo coach en el sistema — se resuelve el usuario
  // Role.COACH y se reusa el mismo flujo "crear si no existe" de arriba.
  async obtenerDelCoach(): Promise<PerfilCoach> {
    const coach = await this.users.findOne({ where: { role: Role.COACH } });
    if (!coach) {
      throw new NotFoundException('No hay un coach configurado todavía.');
    }
    return this.obtenerOCrearPropio(coach.id);
  }

  async actualizar(
    coachUserId: string,
    dto: UpdatePerfilCoachDto,
  ): Promise<PerfilCoach> {
    const perfil = await this.obtenerOCrearPropio(coachUserId);
    assignDefined(perfil, dto);
    return this.perfiles.save(perfil);
  }

  private async borrarArchivoAnterior(path: string | null): Promise<void> {
    if (!path) return;
    await unlink(join(UPLOADS_DIR, path)).catch(() => {
      // Best-effort: si ya no está o falla el borrado, no bloquea el reemplazo.
    });
  }

  async actualizarFoto(
    coachUserId: string,
    archivo: Express.Multer.File,
  ): Promise<PerfilCoach> {
    const perfil = await this.obtenerOCrearPropio(coachUserId);
    await this.borrarArchivoAnterior(perfil.fotoPath);
    perfil.fotoPath = archivo.filename;
    perfil.fotoNombre = archivo.originalname;
    return this.perfiles.save(perfil);
  }

  async actualizarCv(
    coachUserId: string,
    archivo: Express.Multer.File,
  ): Promise<PerfilCoach> {
    const perfil = await this.obtenerOCrearPropio(coachUserId);
    await this.borrarArchivoAnterior(perfil.cvPath);
    perfil.cvPath = archivo.filename;
    perfil.cvNombre = archivo.originalname;
    return this.perfiles.save(perfil);
  }

  async agregarCertificacion(
    coachUserId: string,
    dto: CreateCertificacionDto,
    archivo?: Express.Multer.File,
  ): Promise<CertificacionCoach> {
    const perfil = await this.obtenerOCrearPropio(coachUserId);
    return this.certificaciones.save(
      this.certificaciones.create({
        perfilCoachId: perfil.id,
        nombre: dto.nombre,
        entidadEmisora: dto.entidadEmisora ?? null,
        fecha: dto.fecha ?? null,
        archivoPath: archivo?.filename ?? null,
        archivoNombre: archivo?.originalname ?? null,
      }),
    );
  }

  async eliminarCertificacion(
    coachUserId: string,
    certificacionId: string,
  ): Promise<void> {
    const perfil = await this.obtenerOCrearPropio(coachUserId);
    const certificacion = await this.certificaciones.findOne({
      where: { id: certificacionId, perfilCoachId: perfil.id },
    });
    if (!certificacion) {
      throw new NotFoundException('Certificación no encontrada.');
    }
    await this.borrarArchivoAnterior(certificacion.archivoPath);
    await this.certificaciones.remove(certificacion);
  }
}
