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
exports.MessagesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../src.b.prisma/prisma.service");
let MessagesService = class MessagesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    createMessage(message) {
        return this.prisma.message.create({
            data: {
                roomId: message.roomId,
                userId: message.userId,
                content: message.content,
            },
            select: {
                messageId: true,
                roomId: true,
                userId: true,
                content: true,
                createdAt: true,
            },
        });
    }
    updateMessage(message) {
        return this.prisma.message.update({
            where: {
                messageId: message.messageId,
            },
            data: {
                content: message.content,
            },
        });
    }
    findMessagesByRoom(roomId, options) {
        return this.prisma.message.findMany({
            where: { roomId },
            orderBy: { createdAt: 'desc' },
            take: options?.take,
            ...(options?.cursor && {
                cursor: { messageId: options.cursor },
                skip: 1,
            }),
            select: {
                messageId: true,
                content: true,
                userId: true,
                createdAt: true,
            },
        });
    }
    removeMessage(messageId, userId) {
        return this.prisma.message.deleteMany({
            where: {
                userId,
                messageId,
            },
        });
    }
    findMessages(userId) {
        return this.prisma.message.findMany({
            where: { userId },
        });
    }
};
exports.MessagesService = MessagesService;
exports.MessagesService = MessagesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MessagesService);
//# sourceMappingURL=messages.service.js.map