import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog) private readonly logs: Repository<AuditLog>,
  ) {}

  async record(
    action: string,
    options: {
      userId?: string | null;
      targetType?: string;
      targetId?: string;
      metadata?: Record<string, unknown>;
    } = {},
  ): Promise<void> {
    await this.logs.save(
      this.logs.create({
        action,
        userId: options.userId ?? null,
        targetType: options.targetType ?? null,
        targetId: options.targetId ?? null,
        metadata: options.metadata ?? null,
      }),
    );
  }

  find(filtros: { targetId?: string; action?: string }): Promise<AuditLog[]> {
    const where: Record<string, string> = {};
    if (filtros.targetId) where.targetId = filtros.targetId;
    if (filtros.action) where.action = filtros.action;
    return this.logs.find({
      where,
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }
}
