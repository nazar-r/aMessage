"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessagesService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
let MessagesService = class MessagesService {
    constructor() {
        this.prisma = new client_1.PrismaClient();
    }
    async create(messageImage) {
        return this.prisma.$transaction(async (tx) => {
            await tx.roomUser.upsert({
                where: {
                    roomId_userId: {
                        roomId: messageImage.roomId,
                        userId: messageImage.userId,
                    },
                },
                update: {},
                create: {
                    roomId: messageImage.roomId,
                    userId: messageImage.userId,
                },
            });
            return tx.message.create({
                data: {
                    roomId: messageImage.roomId,
                    userId: messageImage.userId,
                    content: messageImage.content,
                },
            });
        });
    }
    update(message) {
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
    findMessages(userId) {
        return this.prisma.message.findMany({
            where: { userId },
        });
    }
    remove(messageId, userId) {
        return this.prisma.message.deleteMany({
            where: {
                userId: userId,
                messageId: messageId,
            },
        });
    }
};
exports.MessagesService = MessagesService;
exports.MessagesService = MessagesService = __decorate([
    (0, common_1.Injectable)()
], MessagesService);
//# sourceMappingURL=messages.service.js.map