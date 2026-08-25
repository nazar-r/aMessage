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
exports.ChatsGateway = void 0;
const socket_io_1 = require("socket.io");
const socket_b_service_1 = require("./socket.b.service");
const messages_service_1 = require("../src.a.messages/messages.service");
const prisma_service_1 = require("../src.b.prisma/prisma.service");
const websockets_1 = require("@nestjs/websockets");
const websockets_2 = require("@nestjs/websockets");
let ChatsGateway = class ChatsGateway {
    constructor(messagesService, chatsGatewayLogic, usePrisma) {
        this.messagesService = messagesService;
        this.chatsGatewayLogic = chatsGatewayLogic;
        this.usePrisma = usePrisma;
    }
    async handleJoinRoom(client, payload) {
        const user = client.data.user;
        const userId = this.chatsGatewayLogic.resolveUserId(user);
        const peerId = payload.peerId;
        if (!peerId)
            throw new websockets_2.WsException('Peer not found');
        const roomId = this.chatsGatewayLogic.signRoomId(userId, peerId);
        const previousRoom = client.data.roomId;
        if (previousRoom && previousRoom !== roomId)
            client.leave(previousRoom);
        client.join(roomId);
        client.data.roomId = roomId;
        client.data.peerId = peerId;
        const onlineUsers = await this.chatsGatewayLogic.getOnlineUsers();
        const messages = await this.messagesService.findMessagesByRoom(roomId, {
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
    async handleGetUsersOnline(client) {
        const onlineUsers = await this.chatsGatewayLogic.getOnlineUsers();
        client.emit('usersOnline', onlineUsers);
    }
    async createMessage(client, payload) {
        const roomId = client.data.roomId;
        const user = client.data.user;
        const userId = this.chatsGatewayLogic.resolveUserId(user);
        const createdAt = new Date();
        this.server.to(roomId).emit('newMessage', {
            userId,
            messageId: payload.clientMessageId,
            text: payload.text,
            time: createdAt,
            pending: true,
        });
        const savedMessage = await this.messagesService.createMessage({
            messageId: payload.clientMessageId,
            roomId,
            userId,
            peerId: client.data.peerId,
            content: payload.text,
        });
        this.chatsGatewayLogic.setDataIntoRedis(roomId, async () => {
            await this.chatsGatewayLogic.formattingRedisData(async () => {
                this.server.to(roomId).emit('messageSaved', {
                    messageId: savedMessage.messageId,
                    userId: savedMessage.userId,
                    text: savedMessage.content,
                    time: savedMessage.createdAt,
                    pending: false,
                });
            }, 'Failed to save message');
        });
    }
    async updateUserMessage(client, payload) {
        const roomId = client.data.roomId;
        if (!roomId) {
            throw new websockets_2.WsException('Room not found');
        }
        const user = client.data.user;
        const userId = this.chatsGatewayLogic.resolveUserId(user);
        await this.chatsGatewayLogic.formattingRedisData(async () => {
            this.server.to(roomId).emit('messageUpdate', {
                messageId: payload.messageId,
                userId,
                text: payload.text,
            });
            await this.messagesService.updateMessage({
                messageId: payload.messageId,
                content: payload.text,
            });
        }, 'Failed to update message');
    }
    async removeUserMessage(client, payload) {
        const roomId = client.data.roomId;
        if (!roomId) {
            throw new websockets_2.WsException('Room not found');
        }
        const user = client.data.user;
        const userId = this.chatsGatewayLogic.resolveUserId(user);
        await this.chatsGatewayLogic.formattingRedisData(async () => {
            this.server.to(roomId).emit('messageRemove', {
                messageId: payload.messageId,
                userId,
            });
            await this.messagesService.removeMessage(payload.messageId, userId);
        }, 'Failed to remove message');
    }
    async afterInit() {
        await this.chatsGatewayLogic.afterInit(this.server);
    }
    async handleConnection(client) {
        await this.chatsGatewayLogic.handleConnection(client);
    }
    async handleDisconnect(client) {
        await this.chatsGatewayLogic.handleDisconnect(client);
    }
};
exports.ChatsGateway = ChatsGateway;
__decorate([
    (0, websockets_2.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], ChatsGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('joinRoom'),
    __param(0, (0, websockets_2.ConnectedSocket)()),
    __param(1, (0, websockets_2.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatsGateway.prototype, "handleJoinRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('getUsersOnline'),
    __param(0, (0, websockets_2.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], ChatsGateway.prototype, "handleGetUsersOnline", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('newMessage'),
    __param(0, (0, websockets_2.ConnectedSocket)()),
    __param(1, (0, websockets_2.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatsGateway.prototype, "createMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('messageUpdate'),
    __param(0, (0, websockets_2.ConnectedSocket)()),
    __param(1, (0, websockets_2.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatsGateway.prototype, "updateUserMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('messageRemove'),
    __param(0, (0, websockets_2.ConnectedSocket)()),
    __param(1, (0, websockets_2.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatsGateway.prototype, "removeUserMessage", null);
exports.ChatsGateway = ChatsGateway = __decorate([
    (0, websockets_2.WebSocketGateway)({
        cors: {
            credentials: true,
        },
    }),
    __metadata("design:paramtypes", [messages_service_1.MessagesService,
        socket_b_service_1.ChatsGatewayLogic,
        prisma_service_1.PrismaService])
], ChatsGateway);
//# sourceMappingURL=socket.b.gateway.js.map