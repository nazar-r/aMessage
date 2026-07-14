import { RedisClientType } from 'redis';
import { RedisService } from './redis.service';
type RedisClient = RedisClientType;
export declare class ChatRedisAdapter {
    private readonly redisService;
    readonly pubClient: RedisClient;
    subClient: RedisClient;
    redisClient: RedisClient;
    private initialized;
    constructor(redisService: RedisService);
    initialize(): Promise<void>;
}
export {};
