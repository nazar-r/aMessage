import { Injectable} from '@nestjs/common';
import { RedisClientType } from 'redis';
import { RedisService } from './redis.service';

@Injectable()
export class ChatRedisAdapter {
  readonly pubClient: RedisClientType;

  subClient!: RedisClientType;
  redisClient!: RedisClientType;

  private initialized = false;

  constructor(private readonly redisService: RedisService) {
    this.pubClient = this.redisService.getClient();
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    this.subClient = await this.redisService.duplicate();
    this.redisClient = await this.redisService.duplicate();
    this.initialized = true;
  }
}