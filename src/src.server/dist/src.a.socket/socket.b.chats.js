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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketChatsGateway = void 0;
const prisma_service_1 = require("../src.b.prisma/prisma.service");
const socket_b_service_1 = require("./socket.b.service");
const socket_io_1 = require("socket.io");
const messages_service_1 = require("../src.a.messages/messages.service");
const websockets_1 = require("@nestjs/websockets");
let SocketChatsGateway = class SocketChatsGateway {
    constructor(usePrisma, useSocketService, useMessagesService) {
        this.usePrisma = usePrisma;
        this.useSocketService = useSocketService;
        this.useMessagesService = useMessagesService;
    }
    async handleJoinRoom(client, payload) {
        const user = client.data.user;
        const peerId = payload.peerId;
        const userId = this.useSocketService.resolveUserId(user);
        const roomId = this.useSocketService.signRoomId(userId, peerId);
        const previousRoom = client.data.roomId;
        if (previousRoom && previousRoom !== roomId)
            client.leave(previousRoom);
        client.join(roomId);
        client.data.roomId = roomId;
        client.data.peerId = peerId;
        const messages = await this.useMessagesService.getMessagesByRoom(roomId, {
            take: 30,
        });
        const orderedMessages = messages.reverse();
        client.emit('messagesHistory', {
            messages: orderedMessages.map((msg) => ({
                userId: msg.userId,
                messageId: msg.messageId,
                text: msg.content,
                createdAt: msg.createdAt,
            })),
            nextCursor: orderedMessages[0]?.messageId ?? null,
        });
        const myPublicKey = await this.usePrisma.user.findUnique({
            where: {
                userId,
            },
            select: {
                pubKey: true,
            },
        });
        if (myPublicKey?.pubKey) {
            client.to(roomId).emit('e2ee:peerPublicKey', {
                userId,
                publicKey: myPublicKey.pubKey,
            });
        }
        const peerPublicKey = await this.usePrisma.user.findUnique({
            where: {
                userId: peerId,
            },
            select: {
                pubKey: true,
            },
        });
        if (peerPublicKey?.pubKey) {
            client.emit('e2ee:peerPublicKey', {
                userId: peerId,
                publicKey: peerPublicKey.pubKey,
            });
        }
        client.to(roomId).emit('user-joined', { userId });
    }
    async createMessage(client, payload) {
        const roomId = client.data.roomId;
        const user = client.data.user;
        const userId = this.useSocketService.resolveUserId(user);
        const createdAt = new Date();
        this.server.to(roomId).emit('newMessage', {
            userId,
            messageId: payload.clientMessageId,
            text: payload.text,
            time: createdAt,
            pending: true,
        });
        const savedMessage = await this.useMessagesService.createMessage({
            messageId: payload.clientMessageId,
            roomId,
            userId,
            peerId: client.data.peerId,
            content: payload.text,
        });
        await this.useSocketService.formatAction(async () => {
            this.server.to(roomId).emit('messageSaved', {
                messageId: savedMessage.messageId,
                userId: savedMessage.userId,
                text: savedMessage.content,
                time: savedMessage.createdAt,
                pending: false,
            });
        }, 'Failed to save message');
    }
    async updateUserMessage(client, payload) {
        const roomId = client.data.roomId;
        const user = client.data.user;
        const userId = this.useSocketService.resolveUserId(user);
        await this.useSocketService.formatAction(async () => {
            this.server.to(roomId).emit('messageUpdate', {
                messageId: payload.messageId,
                userId,
                text: payload.text,
            });
            await this.useMessagesService.updateMessage({
                messageId: payload.messageId,
                content: payload.text,
            });
        }, 'Failed to update message');
    }
    async removeUserMessage(client, payload) {
        const roomId = client.data.roomId;
        const user = client.data.user;
        const userId = this.useSocketService.resolveUserId(user);
        await this.useSocketService.formatAction(async () => {
            this.server.to(roomId).emit('messageRemove', {
                messageId: payload.messageId,
                userId,
            });
            await this.useMessagesService.removeMessage(payload.messageId, userId);
        }, 'Failed to remove message');
    }
};
exports.SocketChatsGateway = SocketChatsGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], SocketChatsGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('joinRoom'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], SocketChatsGateway.prototype, "handleJoinRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('newMessage'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], SocketChatsGateway.prototype, "createMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('messageUpdate'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], SocketChatsGateway.prototype, "updateUserMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('messageRemove'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], SocketChatsGateway.prototype, "removeUserMessage", null);
exports.SocketChatsGateway = SocketChatsGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            credentials: true,
        },
    }),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        socket_b_service_1.SocketService,
        messages_service_1.MessagesService])
], SocketChatsGateway);
//# sourceMappingURL=socket.b.chats.js.map