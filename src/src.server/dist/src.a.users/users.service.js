"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../src.b.prisma/prisma.service");
const redis_service_1 = require("../src.b.redis/redis.service");
let UsersService = class UsersService {
    constructor(usePrisma, useRedis) {
        this.usePrisma = usePrisma;
        this.useRedis = useRedis;
    }
    async findOrCreateUser(profile) {
        const user = await this.usePrisma.user.upsert({
            where: { userId: profile.userId },
            update: {
                userId: profile.userId,
                email: profile.userEmail,
                userName: profile.userName,
            },
            create: {
                userId: profile.userId,
                email: profile.userEmail,
                userName: profile.userName,
            },
        });
        return {
            ...user,
            name: user.userName,
        };
    }
    async findAllUsers(userId) {
        const cacheKey = `users:list:${userId}`;
        const cachedUsers = await this.useRedis.getRedisData(cacheKey);
        if (typeof cachedUsers === 'string') {
            return JSON.parse(cachedUsers);
        }
        const chosenUsers = await this.usePrisma.$queryRaw `
  SELECT
    u."userId",
    u."userName",
    EXISTS (
      SELECT 1
      FROM "Contact" c
      WHERE c."userId" = ${userId}
        AND c."contactId" = u."userId"
    ) AS "isContact"
  FROM "User" u
  WHERE u."userId" <> ${userId}
  ORDER BY u."userName" DESC
  LIMIT 25;
`;
        await this.useRedis.setRedisData(cacheKey, JSON.stringify(chosenUsers), 10);
        return chosenUsers;
    }
    setUserPubKey(userId, userPubKey) {
        return this.usePrisma.user.update({
            where: { userId },
            data: {
                pubKey: userPubKey,
            },
        });
    }
    setUserContact(userContact) {
        return this.usePrisma.contact.upsert({
            where: {
                userId_contactId: {
                    userId: userContact.userId,
                    contactId: userContact.contactId,
                },
            },
            update: {},
            create: {
                userId: userContact.userId,
                contactId: userContact.contactId,
            },
        });
    }
    deleteUserContact(userContact) {
        return this.usePrisma.contact.delete({
            where: {
                userId_contactId: {
                    userId: userContact.userId,
                    contactId: userContact.contactId,
                },
            },
        });
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService])
], UsersService);
//# sourceMappingURL=users.service.js.map