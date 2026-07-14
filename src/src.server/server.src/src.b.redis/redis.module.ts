import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { ChatRedisAdapter } from './redis.adapter';

@Global()
@Module({
  providers: [RedisService, ChatRedisAdapter],
  exports: [RedisService, ChatRedisAdapter],
})
export class RedisModule {}