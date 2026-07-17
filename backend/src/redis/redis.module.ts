import { Module } from '@nestjs/common';
import { RedisService, redisClientFactory } from './redis.service';

@Module({
  providers: [redisClientFactory, RedisService],
  exports: [RedisService],
})
export class RedisModule {}
