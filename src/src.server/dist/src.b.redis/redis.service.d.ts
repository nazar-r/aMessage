import { RedisClientType } from 'redis';
import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
export declare class RedisService implements OnModuleInit, OnModuleDestroy {
    private readonly logger;
    private readonly client;
    setRedisData(key: string, value: string, time: number): Promise<string | {}>;
    getRedisData(key: string): Promise<string | null>;
    deleteRedisData(key: string): Promise<number>;
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    getClient(): RedisClientType;
    duplicate(): Promise<RedisClientType>;
}
