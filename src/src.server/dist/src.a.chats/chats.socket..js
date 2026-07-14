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
var ChatsGatewayLogic_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatsGatewayLogic = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const messages_service_1 = require("../src.a.messages/messages.service");
const redis_adapter_1 = require("../src.b.redis/redis.adapter");
const websockets_1 = require("@nestjs/websockets");
let ChatsGatewayLogic = ChatsGatewayLogic_1 = class ChatsGatewayLogic {
    constructor(messagesService, redisAdapter) {
        this.messagesService = messagesService;
        this.redisAdapter = redisAdapter;
        this.logger = new common_1.Logger(ChatsGatewayLogic_1.name);
        this.roomMessageSaveChains = new Map();
    }
    setServer(server) {
        this.server = server;
    }
    getServer() {
        const server = this.server;
        if (!server)
            throw new websockets_1.WsException('Server not found');
        return server;
    }
    async catchSocketError(action, errorMessage) {
        try {
            await action();
        }
        catch (error) {
            this.logger.error(error);
            throw new websockets_1.WsException(errorMessage);
        }
    }
    resolveUserId(payload) {
        const userId = payload?.sub;
        if (!userId)
            throw new websockets_1.WsException('User not found');
        return userId;
    }
    signRoomId(userA, userB) {
        return JSON.stringify([userA, userB].sort());
    }
    async addWatchedRoom(userId, roomId) {
        await this.redisAdapter.redisClient.sAdd(ChatsGatewayLogic_1.WATCHED_ROOMS_PREFIX + userId, roomId);
    }
    async getWatchedRooms(userId) {
        return (await this.redisAdapter.redisClient.sMembers(ChatsGatewayLogic_1.WATCHED_ROOMS_PREFIX + userId));
    }
    async broadcastPresenceToWatchedRooms(userId, status) {
        const server = this.getServer();
        const rooms = await this.getWatchedRooms(userId);
        for (const roomId of rooms) {
            server.to(roomId).emit('user-status', {
                userId,
                status,
            });
        }
    }
    async getPublicKey(userId) {
        return (await this.redisAdapter.redisClient.get(ChatsGatewayLogic_1.PUBLIC_KEY_PREFIX + userId));
    }
    async setPublicKeyIntoRedis(userId, publicKey) {
        await this.redisAdapter.redisClient.set(ChatsGatewayLogic_1.PUBLIC_KEY_PREFIX + userId, publicKey);
    }
    normalizePublicKey(publicKey) {
        const normalized = publicKey?.trim();
        if (!normalized)
            throw new websockets_1.WsException('Invalid public key');
        const decoded = Buffer.from(normalized, 'base64');
        if (decoded.length !== 32) {
            throw new websockets_1.WsException('Invalid public key length');
        }
        return normalized;
    }
    saveMessageIntoDb(roomId, task) {
        const previous = this.roomMessageSaveChains.get(roomId) ?? Promise.resolve();
        const current = previous.catch(() => undefined).then(task);
        const tracked = current.then(() => undefined, () => undefined);
        this.roomMessageSaveChains.set(roomId, tracked);
        void tracked.finally(() => {
            if (this.roomMessageSaveChains.get(roomId) === tracked) {
                this.roomMessageSaveChains.delete(roomId);
            }
        });
    }
    async handleJoinRoom(client, payload) {
        const user = client.data.user;
        const userId = this.resolveUserId(user);
        const peerId = payload.peerId;
        if (!peerId)
            throw new websockets_1.WsException('Peer not found');
        const roomId = this.signRoomId(userId, peerId);
        const previousRoom = client.data.roomId;
        if (previousRoom && previousRoom !== roomId)
            client.leave(previousRoom);
        client.join(roomId);
        client.data.roomId = roomId;
        client.data.peerId = peerId;
        await this.addWatchedRoom(userId, roomId);
        await this.addWatchedRoom(peerId, roomId);
        client.emit('user-status', {
            userId: peerId,
            status: (await this.checkUserOnlineStatus(peerId)) ? 'online' : 'offline',
        });
        const candidateIds = [userId, peerId].filter((id, index, arr) => arr.indexOf(id) === index);
        const onlineFlags = await Promise.all(candidateIds.map((id) => this.checkUserOnlineStatus(id)));
        client.emit('users-online', candidateIds.filter((_, i) => onlineFlags[i]));
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
        const myPublicKey = await this.getPublicKey(userId);
        if (myPublicKey) {
            client.to(roomId).emit('e2ee:peerPublicKey', {
                userId,
                publicKey: myPublicKey,
            });
        }
        const peerPublicKey = await this.getPublicKey(peerId);
        if (peerPublicKey) {
            client.emit('e2ee:peerPublicKey', {
                userId: peerId,
                publicKey: peerPublicKey,
            });
        }
        client.to(roomId).emit('user-joined', { userId });
    }
    async setPublicKey(client, payload) {
        const publicKey = this.normalizePublicKey(payload?.publicKey);
        const user = client.data.user;
        const roomId = client.data.roomId;
        const userId = this.resolveUserId(user);
        if (!roomId)
            throw new websockets_1.WsException('Room not found');
        await this.setPublicKeyIntoRedis(userId, publicKey);
        client.data.e2eePublicKey = publicKey;
        client.to(roomId).emit('e2ee:peerPublicKey', {
            userId,
            publicKey,
        });
    }
    async requestPeerPublicKey(client) {
        const peerId = client.handshake.query.peerId;
        if (!peerId)
            throw new websockets_1.WsException('Peer not found');
        const publicKey = await this.getPublicKey(peerId);
        client.emit('e2ee:peerPublicKey', {
            userId: peerId,
            publicKey: publicKey ?? null,
        });
        return { ok: true, found: Boolean(publicKey) };
    }
    async createMessage(client, payload) {
        const roomId = client.data.roomId;
        if (!roomId) {
            throw new websockets_1.WsException('Room not found');
        }
        const user = client.data.user;
        const userId = this.resolveUserId(user);
        const tempMessageId = (0, crypto_1.randomUUID)();
        const createdAt = new Date();
        const server = this.getServer();
        server.to(roomId).emit('newMessage', {
            userId,
            messageId: tempMessageId,
            text: payload.text,
            time: createdAt,
            pending: true,
        });
        this.saveMessageIntoDb(roomId, async () => {
            await this.catchSocketError(async () => {
                const savedMessage = await this.messagesService.createMessage({
                    userId,
                    roomId,
                    content: payload.text,
                });
                server.to(roomId).emit('messageSaved', {
                    tempMessageId,
                    messageId: savedMessage.messageId,
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
            throw new websockets_1.WsException('Room not found');
        }
        const user = client.data.user;
        const userId = this.resolveUserId(user);
        const server = this.getServer();
        await this.catchSocketError(async () => {
            server.to(roomId).emit('messageUpdated', {
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
            throw new websockets_1.WsException('Room not found');
        }
        const user = client.data.user;
        const userId = this.resolveUserId(user);
        const server = this.getServer();
        await this.catchSocketError(async () => {
            server.to(roomId).emit('messageRemoved', {
                messageId: payload.messageId,
                userId,
            });
            await this.messagesService.removeMessage(payload.messageId, userId);
        }, 'Failed to remove message');
    }
    async addOnlineSocket(userId, socketId) {
        const key = ChatsGatewayLogic_1.ONLINE_SOCKETS_PREFIX + userId;
        await this.redisAdapter.redisClient.sAdd(key, socketId);
        return (await this.redisAdapter.redisClient.sCard(key));
    }
    async removeOnlineSocket(userId, socketId) {
        const key = ChatsGatewayLogic_1.ONLINE_SOCKETS_PREFIX + userId;
        await this.redisAdapter.redisClient.sRem(key, socketId);
        const count = (await this.redisAdapter.redisClient.sCard(key));
        count === 0 && await this.redisAdapter.redisClient.del(key);
        return count;
    }
    async checkUserOnlineStatus(userId) {
        const count = (await this.redisAdapter.redisClient.sCard(ChatsGatewayLogic_1.ONLINE_SOCKETS_PREFIX + userId));
        return count > 0;
    }
    async connectSocket(client) {
        const connectUser = async () => {
            const user = client.data.user;
            const userId = this.resolveUserId(user);
            const nextCount = await this.addOnlineSocket(userId, client.id);
            client.join(userId);
            if (nextCount === 1) {
                await this.broadcastPresenceToWatchedRooms(userId, 'online');
            }
        };
        const disconnectUser = (error) => {
            this.logger.error(error);
            client.disconnect(true);
        };
        try {
            await connectUser();
        }
        catch (error) {
            disconnectUser(error);
        }
    }
    async disconnectSocket(client) {
        const userId = client.data.user?.sub;
        if (!userId)
            return;
        const nextCount = await this.removeOnlineSocket(userId, client.id);
        nextCount === 0 && await this.broadcastPresenceToWatchedRooms(userId, 'offline');
    }
};
exports.ChatsGatewayLogic = ChatsGatewayLogic;
ChatsGatewayLogic.PUBLIC_KEY_PREFIX = 'chat:e2ee:pubkey:';
ChatsGatewayLogic.ONLINE_SOCKETS_PREFIX = 'chat:online:sockets:';
ChatsGatewayLogic.WATCHED_ROOMS_PREFIX = 'chat:watched-rooms:';
exports.ChatsGatewayLogic = ChatsGatewayLogic = ChatsGatewayLogic_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [messages_service_1.MessagesService,
        redis_adapter_1.ChatRedisAdapter])
], ChatsGatewayLogic);
//# sourceMappingURL=chats.socket..js.map