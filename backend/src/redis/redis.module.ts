import { Module } from '@nestjs/common';
import { RedisService, redisClientFactory } from './redis.service';
import { SessionRevocationService } from './session-revocation.service';

@Module({
  providers: [redisClientFactory, RedisService, SessionRevocationService],
  exports: [RedisService, SessionRevocationService],
})
export class RedisModule {}
