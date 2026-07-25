import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notificacion } from './entities/notificacion.entity';
import { TipoNotificacion } from './enums/tipo-notificacion.enum';

const DEFAULT_LIMIT = 20;

@Injectable()
export class NotificacionesService {
  constructor(
    @InjectRepository(Notificacion)
    private readonly notificaciones: Repository<Notificacion>,
  ) {}

  crear(
    userId: string,
    tipo: TipoNotificacion,
    mensaje: string,
    link?: string,
  ): Promise<Notificacion> {
    return this.notificaciones.save(
      this.notificaciones.create({ userId, tipo, mensaje, link: link ?? null }),
    );
  }

  listarPropias(
    userId: string,
    limit = DEFAULT_LIMIT,
  ): Promise<Notificacion[]> {
    return this.notificaciones.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  contarNoLeidas(userId: string): Promise<number> {
    return this.notificaciones.count({ where: { userId, leida: false } });
  }

  async marcarLeida(id: string, userId: string): Promise<Notificacion> {
    const notificacion = await this.notificaciones.findOne({
      where: { id, userId },
    });
    if (!notificacion) {
      throw new NotFoundException('Notificación no encontrada');
    }
    notificacion.leida = true;
    return this.notificaciones.save(notificacion);
  }
}
