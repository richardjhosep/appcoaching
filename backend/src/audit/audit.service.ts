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
}
