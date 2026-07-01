import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
    private client: RedisClientType;

    async onModuleInit() {
        this.client = createClient({
            url: 
            // process.env.REDIS_URL ?? 
            'redis://127.0.0.1:6379',
        });

        this.client.on('error', (err) => {
            console.error('Redis error:', err);
        });

        await this.client.connect();
    }

    getRedisClient() {
        return this.client;
    }

    setRedisData(key: string, value: string, ttlSeconds?: number) {
        if (ttlSeconds) {
            return this.client.set(key, value, { EX: ttlSeconds });
        }

        return this.client.set(key, value);
    }

    getRedisData(key: string) {
        return this.client.get(key);
    }

    deleteRedisData(key: string) {
        return this.client.del(key);
    }

    onModuleDestroy() {
        if (this.client) {
            this.client.quit().catch(() => undefined);
        }
    }
}