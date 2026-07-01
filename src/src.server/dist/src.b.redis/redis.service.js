"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisService = void 0;
const common_1 = require("@nestjs/common");
const redis_1 = require("redis");
let RedisService = class RedisService {
    async onModuleInit() {
        this.client = (0, redis_1.createClient)({
            url: 'redis://127.0.0.1:6379',
        });
        this.client.on('error', (err) => {
            console.error('Redis error:', err);
        });
        await this.client.connect();
    }
    getRedisClient() {
        return this.client;
    }
    setRedisData(key, value, ttlSeconds) {
        if (ttlSeconds) {
            return this.client.set(key, value, { EX: ttlSeconds });
        }
        return this.client.set(key, value);
    }
    getRedisData(key) {
        return this.client.get(key);
    }
    deleteRedisData(key) {
        return this.client.del(key);
    }
    onModuleDestroy() {
        if (this.client) {
            this.client.quit().catch(() => undefined);
        }
    }
};
exports.RedisService = RedisService;
exports.RedisService = RedisService = __decorate([
    (0, common_1.Injectable)()
], RedisService);
//# sourceMappingURL=redis.service.js.map