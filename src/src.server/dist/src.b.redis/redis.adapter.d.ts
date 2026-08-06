import { RedisClientType } from 'redis';
import { RedisService } from './redis.service';
export declare class ChatRedisAdapter {
    private readonly redisService;
    readonly pubClient: RedisClientType;
    subClient: RedisClientType;
    redisClient: RedisClientType;
    private initialized;
    constructor(redisService: RedisService);
    initialize(): Promise<void>;
}
