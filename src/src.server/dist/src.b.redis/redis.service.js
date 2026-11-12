"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var RedisService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisService = void 0;
const redis_1 = require("redis");
const common_1 = require("@nestjs/common");
let RedisService = RedisService_1 = class RedisService {
    constructor() {
        this.logger = new common_1.Logger(RedisService_1.name);
        this.client = (0, redis_1.createClient)({
            url: process.env.REDIS_URL,
        });
    }
    setRedisData(key, value, time) {
        return this.client.set(key, value, { EX: time });
    }
    getRedisData(key) {
        return this.client.get(key);
    }
    deleteRedisData(key) {
        return this.client.del(key);
    }
    async onModuleInit() {
        await this.client.connect();
        await this.client.flushAll();
        this.logger.log('Redis connected and all Redis data cleared');
    }
    async onModuleDestroy() {
        this.client.isOpen && await this.client.quit().catch(() => undefined);
        this.logger.log('Redis disconnected');
    }
    getClient() {
        return this.client;
    }
    async duplicate() {
        const duplicated = this.client.duplicate();
        await duplicated.connect();
        return duplicated;
    }
};
exports.RedisService = RedisService;
exports.RedisService = RedisService = RedisService_1 = __decorate([
    (0, common_1.Injectable)()
], RedisService);
//# sourceMappingURL=redis.service.js.map