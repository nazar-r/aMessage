import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { RedisClientType } from 'redis';
export declare class RedisService implements OnModuleInit, OnModuleDestroy {
    private readonly client;
    onModuleInit(): Promise<void>;
    getClient(): RedisClientType;
    duplicate(): Promise<RedisClientType>;
    setRedisData(key: string, value: string, ttlSeconds?: number): Promise<string | {}>;
    getRedisData(key: string): Promise<string | {}>;
    deleteRedisData(key: string): Promise<number>;
    onModuleDestroy(): Promise<void>;
}
