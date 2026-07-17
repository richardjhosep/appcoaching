import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { Role } from '../auth/enums/role.enum';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private readonly users: UsersService,
    private readonly config: ConfigService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const alreadyHasCoach = await this.users.hasAnyWithRole(Role.COACH);
    if (alreadyHasCoach) {
      return;
    }

    const email = this.config.get<string>('seed.coachEmail');
    const password = this.config.get<string>('seed.coachPassword');
    if (!email || !password) {
      this.logger.warn(
        'No coach account exists and SEED_COACH_EMAIL/SEED_COACH_PASSWORD are not set — skipping bootstrap seed.',
      );
      return;
    }

    const created = await this.users.seedCoachIfMissing(email, password);
    if (created) {
      this.logger.log(`Seeded initial coach account: ${email}`);
    }
  }
}
