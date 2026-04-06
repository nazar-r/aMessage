"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
let UsersService = class UsersService {
    constructor() {
        this.prisma = new client_1.PrismaClient();
    }
    findAllUsers(userId) {
        return this.prisma.user.findMany({
            where: {
                userId: { not: userId }
            },
            select: {
                userId: true,
                userName: true,
            },
        });
    }
    findOrCreateUser(profile) {
        if (!profile.userId)
            throw new common_1.UnauthorizedException({
                message: 'ID is missing in your Service profile',
                error: 'Unauthorized',
            });
        return this.prisma.user.upsert({
            where: { email: profile.email },
            update: { userName: profile.name || 'Unknown' },
            create: { email: profile.email, userId: profile.userId, userName: profile.name || 'Unknown' },
        });
    }
    updateRefreshToken(userId, refreshTokenHash) {
        return this.prisma.user.update({
            where: { userId: userId },
            data: { refreshToken: refreshTokenHash },
        });
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)()
], UsersService);
//# sourceMappingURL=users.service.js.map