import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
    private readonly client: RedisClientType = createClient({
        url: process.env.REDIS_URL,
    });

    onModuleInit() {
        this.client.connect();
    }

    getClient(): RedisClientType {
        return this.client;
    }

    async duplicate(): Promise<RedisClientType> {
        const duplicated = this.client.duplicate();

        await duplicated.connect();
        return duplicated;
    }

    setRedisData(key: string, value: string, ttlSeconds?: number) {
        if (ttlSeconds !== undefined) return this.client.set(key, value, { EX: ttlSeconds })
        return this.client.set(key, value);
    }

    getRedisData(key: string) {
        return this.client.get(key);
    }

    deleteRedisData(key: string) {
        return this.client.del(key);
    }

    async onModuleDestroy(): Promise<void> {
        this.client.isOpen && await this.client.quit().catch(() => undefined)
    }
}