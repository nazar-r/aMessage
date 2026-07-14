import { Injectable} from '@nestjs/common';
import { RedisClientType } from 'redis';
import { RedisService } from './redis.service';

type RedisClient = RedisClientType;

@Injectable()
export class ChatRedisAdapter {
  readonly pubClient: RedisClient;

  subClient!: RedisClient;
  redisClient!: RedisClient;

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