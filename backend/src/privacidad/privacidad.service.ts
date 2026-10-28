import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { unlink } from 'fs/promises';
import { resolve, sep } from 'path';
import { Coachee } from '../coachees/entities/coachee.entity';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { NotificacionesService } from '../notificaciones/notificaciones.service';
import { TipoNotificacion } from '../notificaciones/enums/tipo-notificacion.enum';
import { Role } from '../auth/enums/role.enum';
import { UPLOADS_DIR } from '../recursos/uploads-dir.util';

// Columnas que nunca salen en una exportación: son secretos de la cuenta, no datos del titular.
const COLUMNA_SECRETA = /token|hash|password/i;

interface TablaDelCoachee {
  tabla: string;
  columna: string;
  columnasArchivo: string[];
}

export interface ExportacionDatos {
  generadoEn: string;
  titular: { id: string; nombre: string; email: string | null };
  datos: Record<string, Array<Record<string, unknown>>>;
  archivos: Array<{ tabla: string; archivo: string }>;
}

/**
 * Derechos del titular (Ley 21.719): acceso/portabilidad y supresión.
 *
 * Las tablas que cuelgan de un coachee se descubren desde la metadata de TypeORM (toda FK hacia
 * `coachees`), no desde una lista escrita a mano: cuando se agregue un módulo nuevo con datos del
 * coachee entra solo en la exportación y en la supresión, sin que nadie tenga que acordarse.
 */
@Injectable()
export class PrivacidadService {
  constructor(
    @InjectDataSource() private readonly ds: DataSource,
    @InjectRepository(Coachee) private readonly coachees: Repository<Coachee>,
    @InjectRepository(User) private readonly usuarios: Repository<User>,
    private readonly users: UsersService,
    private readonly notificaciones: NotificacionesService,
  ) {}

  private tablasDelCoachee(): TablaDelCoachee[] {
    const resultado: TablaDelCoachee[] = [];
    for (const meta of this.ds.entityMetadatas) {
      for (const fk of meta.foreignKeys) {
        if (fk.referencedEntityMetadata.target !== Coachee) continue;
        resultado.push({
          tabla: meta.tableName,
          columna: fk.columnNames[0],
          columnasArchivo: meta.columns
            .map((c) => c.databaseName)
            .filter((n) => n.endsWith('_path')),
        });
      }
    }
    return resultado;
  }

  private async cargarCoachee(id: string): Promise<Coachee> {
    const coachee = await this.coachees.findOne({
      where: { id },
      relations: { user: true },
    });
    if (!coachee) throw new NotFoundException('Coachee no encontrado.');
    return coachee;
  }

  async coacheeDeUsuario(userId: string): Promise<Coachee> {
    const coachee = await this.coachees.findOne({ where: { userId } });
    if (!coachee) throw new NotFoundException('Coachee no encontrado.');
    return coachee;
  }

  private quitarSecretos(
    fila: Record<string, unknown>,
  ): Record<string, unknown> {
    return Object.fromEntries(
      Object.entries(fila).filter(([k]) => !COLUMNA_SECRETA.test(k)),
    );
  }

  async exportar(coacheeId: string): Promise<ExportacionDatos> {
    const coachee = await this.cargarCoachee(coacheeId);
    const datos: ExportacionDatos['datos'] = {};
    const archivos: ExportacionDatos['archivos'] = [];

    const [ficha] = await this.ds.query<Array<Record<string, unknown>>>(
      `SELECT * FROM "coachees" WHERE "id" = $1`,
      [coacheeId],
    );
    datos['coachees'] = [this.quitarSecretos(ficha)];
    if (coachee.fotoPath) {
      archivos.push({ tabla: 'coachees', archivo: coachee.fotoPath });
    }

    for (const t of this.tablasDelCoachee()) {
      const filas = await this.ds.query<Array<Record<string, unknown>>>(
        `SELECT * FROM "${t.tabla}" WHERE "${t.columna}" = $1`,
        [coacheeId],
      );
      if (filas.length === 0) continue;
      datos[t.tabla] = filas.map((f) => this.quitarSecretos(f));
      for (const fila of filas) {
        for (const col of t.columnasArchivo) {
          const ruta = fila[col];
          if (typeof ruta === 'string' && ruta) {
            archivos.push({ tabla: t.tabla, archivo: ruta });
          }
        }
      }
    }

    const notificaciones = await this.ds.query<Array<Record<string, unknown>>>(
      `SELECT * FROM "notificaciones" WHERE "user_id" = $1`,
      [coachee.userId],
    );
    if (notificaciones.length > 0) datos['notificaciones'] = notificaciones;

    return {
      generadoEn: new Date().toISOString(),
      titular: {
        id: coachee.id,
        nombre: coachee.nombre,
        email: coachee.user?.email ?? null,
      },
      datos,
      archivos,
    };
  }

  /** El coachee pide la supresión; la ejecuta el coach (decisión legal pendiente: ver tasks/todo.md). */
  async solicitarSupresion(userId: string): Promise<void> {
    const coachee = await this.coacheeDeUsuario(userId);
    const coaches = await this.usuarios.find({
      where: { role: Role.COACH, isActive: true },
    });
    await Promise.all(
      coaches.map((c) =>
        this.notificaciones.crear(
          c.id,
          TipoNotificacion.SUPRESION_SOLICITADA,
          `${coachee.nombre} solicitó la eliminación de sus datos personales.`,
          `/coach/coachees/${coachee.id}?tab=perfil`,
        ),
      ),
    );
  }

  /** Borra al coachee, todo lo que cuelga de él y sus archivos. Irreversible. */
  async suprimir(coacheeId: string, confirmarNombre: string): Promise<number> {
    const coachee = await this.cargarCoachee(coacheeId);
    if (confirmarNombre.trim() !== coachee.nombre.trim()) {
      throw new BadRequestException(
        'El nombre escrito no coincide con el del coachee.',
      );
    }

    const rutas = new Set<string>();
    if (coachee.fotoPath) rutas.add(coachee.fotoPath);
    for (const t of this.tablasDelCoachee()) {
      for (const col of t.columnasArchivo) {
        const filas = await this.ds.query<Array<Record<string, string | null>>>(
          `SELECT "${col}" FROM "${t.tabla}" WHERE "${t.columna}" = $1 AND "${col}" IS NOT NULL`,
          [coacheeId],
        );
        filas.forEach((f) => f[col] && rutas.add(f[col]));
      }
    }

    // Cascada de BD: el usuario arrastra al coachee y todas sus tablas dependientes.
    await this.users.removeById(coachee.userId);

    // Los archivos se borran después y sin romper la supresión si alguno ya no existe.
    const base = resolve(UPLOADS_DIR);
    let borrados = 0;
    for (const ruta of rutas) {
      const absoluta = resolve(base, ruta);
      if (!absoluta.startsWith(base + sep)) continue;
      await unlink(absoluta).then(
        () => borrados++,
        () => undefined,
      );
    }
    return borrados;
  }
}
