import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(RedisService.name);

    private readonly client: RedisClientType = createClient({
        url: process.env.REDIS_URL,
    });

    constructor() {
        this.logger.log(`Redis URL: ${process.env.REDIS_URL}`);

        this.client.on('error', (err) => {
            this.logger.error(`Redis error: ${err.message}`);
        });

        this.client.on('connect', () => {
            this.logger.log('Redis connect event');
        });

        this.client.on('ready', () => {
            this.logger.log('Redis ready event');
        });
    }

    async onModuleInit() {
        this.logger.log('RedisService initializing...');

        try {
            await this.client.connect();

            this.logger.log('Redis connected successfully');
        } catch (error) {
            this.logger.error(
                'Redis connection failed',
                error instanceof Error ? error.stack : String(error),
            );
        }
    }

    async onModuleDestroy() {
        await this.client.quit();
        this.logger.log('Redis disconnected');
    }

    getClient() {
        return this.client;
    }
}