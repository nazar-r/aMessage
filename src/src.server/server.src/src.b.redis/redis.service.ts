import { createClient, RedisClientType } from 'redis';
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(RedisService.name);
    private readonly client: RedisClientType = createClient({
        url: process.env.REDIS_URL,
    });

    setRedisData(key: string, value: string, time: number) {
        return this.client.set(key, value, { EX: time });
    }

    getRedisData(key: string) {
        return this.client.get(key) as Promise<string | null>;
    }

    deleteRedisData(key: string) {
        return this.client.del(key);
    }

    async onModuleInit() {
        await this.client.connect();
        await this.client.flushAll();

        this.logger.log('Redis connected and all Redis data cleared');
    }

    async onModuleDestroy(){
        this.client.isOpen && await this.client.quit().catch(() => undefined);
        this.logger.log('Redis disconnected');
    }

    getClient(): RedisClientType {
        return this.client;
    }

    async duplicate(): Promise<RedisClientType> {
        const duplicated = this.client.duplicate();
        await duplicated.connect();

        return duplicated;
    }
}