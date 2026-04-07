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
var ChatsGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatsGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const websockets_2 = require("@nestjs/websockets");
const common_1 = require("@nestjs/common");
const socket_io_1 = require("socket.io");
const jwt_1 = require("@nestjs/jwt");
const jwt_ws_config_1 = require("../src.b.jwt/jwt.ws.config");
const messages_service_1 = require("../src.a.messages/messages.service");
const cookie = require("cookie");
let ChatsGateway = ChatsGateway_1 = class ChatsGateway {
    constructor(jwtService, messagesService) {
        this.jwtService = jwtService;
        this.messagesService = messagesService;
        this.logger = new common_1.Logger(ChatsGateway_1.name);
        this.publicKeys = new Map();
    }
    afterInit() {
        this.logger.log('ChatsGateway initialized');
    }
    resolveUserId(payload) {
        const userId = payload?.sub ?? payload?.id ?? payload?.userId;
        if (!userId)
            throw new websockets_2.WsException('User not found');
        return userId;
    }
    normalizePublicKey(publicKey) {
        const normalized = publicKey?.trim();
        if (!normalized)
            throw new websockets_2.WsException('Invalid public key');
        const decoded = Buffer.from(normalized, 'base64');
        if (decoded.length !== 32) {
            throw new websockets_2.WsException('Invalid public key length');
        }
        return normalized;
    }
    async handleConnection(client) {
        const peerId = client.handshake.query.peerId;
        if (!peerId) {
            client.disconnect(true);
            return;
        }
        try {
            const rawCookie = client.handshake.headers.cookie ?? '';
            const cookies = cookie.parse(rawCookie);
            const token = cookies['access_token'];
            if (!token) {
                client.disconnect(true);
                return;
            }
            const payload = this.jwtService.verify(token, {
                secret: process.env.JWT_SECRET,
            });
            const userId = this.resolveUserId(payload);
            const roomId = [userId, peerId].sort().join('-');
            client.data.user = payload;
            client.data.roomId = roomId;
            client.join(roomId);
            this.server.to(roomId).emit('user-status', {
                userId,
                status: 'online',
            });
            const socketsInRoom = await this.server.in(roomId).fetchSockets();
            const onlineUsers = socketsInRoom.map((s) => {
                const u = s.data.user;
                return u?.sub ?? u?.id ?? u?.userId;
            })
                .filter(Boolean);
            client.emit('users-online', onlineUsers);
            const messages = await this.messagesService.findMessagesByRoom(roomId, {
                take: 50,
            });
            const orderedMessages = messages.reverse();
            const mapMessage = (msg) => ({
                userId: msg.userId,
                messageId: msg.messageId,
                text: msg.content,
                createdAt: msg.createdAt,
            });
            client.emit('messagesHistory', {
                messages: orderedMessages.map(mapMessage),
                nextCursor: orderedMessages[0]?.messageId || null,
            });
            const myPublicKey = this.publicKeys.get(userId);
            if (myPublicKey) {
                client.to(roomId).emit('e2ee:peerPublicKey', {
                    userId,
                    publicKey: myPublicKey,
                });
            }
            const peerPublicKey = this.publicKeys.get(peerId);
            if (peerPublicKey) {
                client.emit('e2ee:peerPublicKey', {
                    userId: peerId,
                    publicKey: peerPublicKey,
                });
            }
            client.to(roomId).emit('user-joined', { userId });
            this.logger.log(`WS Connection Launched: ${client.id} | User ID: ${userId} | Peer ID: ${peerId} | Room: ${roomId}`);
        }
        catch (error) {
            this.logger.error(error);
            client.disconnect(true);
        }
    }
    handleDisconnect(client) {
        const userId = client.data.user?.sub ??
            client.data.user?.id ??
            client.data.user?.userId;
        const roomId = client.data.roomId;
        if (userId && roomId) {
            this.server.to(roomId).emit('user-status', {
                userId,
                status: 'offline',
            });
        }
        this.logger.log(`WS Connection Closed: ${client.id} | User ID: ${userId}`);
    }
    async handlePublicKey(client, payload) {
        const user = client.data.user;
        const userId = this.resolveUserId(user);
        const roomId = client.data.roomId;
        if (!roomId) {
            throw new websockets_2.WsException('Room not found');
        }
        const publicKey = this.normalizePublicKey(payload?.publicKey);
        this.publicKeys.set(userId, publicKey);
        client.data.e2eePublicKey = publicKey;
        client.to(roomId).emit('e2ee:peerPublicKey', {
            userId,
            publicKey,
        });
        this.logger.log(`Stored E2EE public key for user ${userId}`);
        return { ok: true };
    }
    async handleRequestPeerPublicKey(client) {
        const peerId = client.handshake.query.peerId;
        if (!peerId) {
            throw new websockets_2.WsException('Peer not found');
        }
        const publicKey = this.publicKeys.get(peerId);
        client.emit('e2ee:peerPublicKey', {
            userId: peerId,
            publicKey: publicKey ?? null,
        });
        return { ok: true, found: Boolean(publicKey) };
    }
    async handleMessage(client, payload) {
        const roomId = client.data.roomId;
        const user = client.data.user;
        const userId = this.resolveUserId(user);
        const savedMessage = await this.messagesService.create({
            userId,
            roomId,
            content: payload.text,
        });
        this.server.to(roomId).emit('newMessage', {
            userId,
            messageId: savedMessage.messageId,
            text: savedMessage.content,
        });
    }
    async handleUpdateMessage(client, payload) {
        const user = client.data.user;
        const userId = this.resolveUserId(user);
        try {
            await this.messagesService.update({
                messageId: payload.messageId,
                content: payload.text,
            });
            this.server.to(client.data.roomId).emit('messageUpdated', {
                messageId: payload.messageId,
                userId,
                text: payload.text,
            });
            this.logger.log(`Message updated: ${payload.messageId} by User ${userId}`);
        }
        catch (error) {
            this.logger.error(error);
            throw new websockets_2.WsException('Failed to update message');
        }
    }
    async handleRemoveMessage(client, payload) {
        const user = client.data.user;
        const userId = this.resolveUserId(user);
        try {
            await this.messagesService.remove(payload.messageId, userId);
            const roomId = client.data.roomId;
            this.server.to(roomId).emit('messageRemoved', {
                messageId: payload.messageId,
                userId,
            });
            this.logger.log(`Message removed: ${payload.messageId} by User ${userId}`);
        }
        catch (error) {
            this.logger.error(error);
            throw new websockets_2.WsException('Failed to remove message');
        }
    }
};
exports.ChatsGateway = ChatsGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], ChatsGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('e2ee:publicKey'),
    __param(0, (0, websockets_2.ConnectedSocket)()),
    __param(1, (0, websockets_2.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatsGateway.prototype, "handlePublicKey", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('e2ee:requestPeerPublicKey'),
    __param(0, (0, websockets_2.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], ChatsGateway.prototype, "handleRequestPeerPublicKey", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('message'),
    __param(0, (0, websockets_2.ConnectedSocket)()),
    __param(1, (0, websockets_2.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatsGateway.prototype, "handleMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('updateMessage'),
    __param(0, (0, websockets_2.ConnectedSocket)()),
    __param(1, (0, websockets_2.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatsGateway.prototype, "handleUpdateMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('removeMessage'),
    __param(0, (0, websockets_2.ConnectedSocket)()),
    __param(1, (0, websockets_2.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatsGateway.prototype, "handleRemoveMessage", null);
exports.ChatsGateway = ChatsGateway = ChatsGateway_1 = __decorate([
    (0, common_1.UseGuards)(jwt_ws_config_1.WsJwtGuard),
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: process.env.FRONTEND_URL || 'https://amessage.site',
            credentials: true,
        },
    }),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        messages_service_1.MessagesService])
], ChatsGateway);
//# sourceMappingURL=chats.service.js.map