"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ChatsGatewayLogic_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatsGatewayLogic = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const redis_adapter_1 = require("@socket.io/redis-adapter");
const redis_adapter_2 = require("../src.b.redis/redis.adapter");
const prisma_service_1 = require("../src.b.prisma/prisma.service");
const websockets_1 = require("@nestjs/websockets");
const cookie = __importStar(require("cookie"));
let ChatsGatewayLogic = ChatsGatewayLogic_1 = class ChatsGatewayLogic {
    constructor(jwtService, redisAdapter, usePrisma) {
        this.jwtService = jwtService;
        this.redisAdapter = redisAdapter;
        this.usePrisma = usePrisma;
        this.logger = new common_1.Logger(ChatsGatewayLogic_1.name);
        this.roomMessageSaveChains = new Map();
    }
    async afterInit(server) {
        this.server = server;
        this.server.use((client, next) => {
            try {
                const rawCookie = client.handshake.headers.cookie ?? '';
                const cookies = cookie.parse(rawCookie);
                const token = cookies['access_token'];
                if (!token) {
                    return next(new Error('Unauthorized'));
                }
                const payload = this.jwtService.verify(token, {
                    secret: process.env.JWT_SECRET,
                });
                client.data.user = payload;
                next();
            }
            catch (error) {
                this.logger.error(error);
                next(new Error('Unauthorized'));
            }
        });
        await this.redisAdapter.initialize();
        this.server.adapter((0, redis_adapter_1.createAdapter)(this.redisAdapter.pubClient, this.redisAdapter.subClient));
    }
    async handleConnection(client) {
        await this.connectSocket(client);
    }
    async handleDisconnect(client) {
        await this.disconnectSocket(client);
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
    async connectSocket(client) {
        const connectUser = async () => {
            const user = client.data.user;
            const userId = this.resolveUserId(user);
            const nextCount = await this.pinOnlineSocket(userId, client.id);
            client.join(userId);
            if (nextCount === 1) {
                await this.pinUserStatusIntoServer(userId, 'online');
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
        this.logger.debug({
            userId,
            socketId: client.id,
            sockets: await this.redisAdapter.redisClient.sMembers(ChatsGatewayLogic_1.ONLINE_SOCKETS_PREFIX + userId),
        });
        if (!userId)
            return;
        const nextCount = await this.unpinOnlineSocket(userId, client.id);
        this.logger.debug({
            userId,
            nextCount,
        });
        if (nextCount === 0) {
            await this.pinUserStatusIntoServer(userId, 'offline');
        }
    }
    async ensureRoomExists(roomId, userId, peerId) {
        const existsKey = `room:exists:${roomId}`;
        const lockKey = `room:lock:${roomId}`;
        const cached = await this.redisAdapter.redisClient.get(existsKey);
        if (cached)
            return;
        const lock = await this.redisAdapter.redisClient.set(lockKey, '1', {
            NX: true,
            EX: 5,
        });
        if (!lock)
            return;
        try {
            const cachedAgain = await this.redisAdapter.redisClient.get(existsKey);
            if (cachedAgain)
                return;
            await this.usePrisma.$transaction(async (tx) => {
                await tx.room.upsert({
                    where: { roomId },
                    update: {},
                    create: { roomId },
                });
                await tx.roomUser.createMany({
                    data: [
                        { roomId, userId },
                        { roomId, userId: peerId },
                    ],
                    skipDuplicates: true,
                });
            });
            await this.redisAdapter.redisClient.set(existsKey, '1');
        }
        finally {
            await this.redisAdapter.redisClient.del(lockKey);
        }
    }
    async pinOnlineSocket(userId, socketId) {
        const key = ChatsGatewayLogic_1.ONLINE_SOCKETS_PREFIX + userId;
        await this.redisAdapter.redisClient.sAdd(key, socketId);
        return (await this.redisAdapter.redisClient.sCard(key));
    }
    async unpinOnlineSocket(userId, socketId) {
        const key = ChatsGatewayLogic_1.ONLINE_SOCKETS_PREFIX + userId;
        await this.redisAdapter.redisClient.sRem(key, socketId);
        const count = (await this.redisAdapter.redisClient.sCard(key));
        count === 0 &&
            await this.redisAdapter.redisClient.del(key);
        return count;
    }
    async checkUserOnlineStatus(userId) {
        const count = (await this.redisAdapter.redisClient.sCard(ChatsGatewayLogic_1.ONLINE_SOCKETS_PREFIX + userId));
        return count > 0;
    }
    async addWatchedRoom(userId, roomId) {
        await this.redisAdapter.redisClient.sAdd(ChatsGatewayLogic_1.WATCHED_ROOMS_PREFIX + userId, roomId);
    }
    async getWatchedRooms(userId) {
        return (await this.redisAdapter.redisClient.sMembers(ChatsGatewayLogic_1.WATCHED_ROOMS_PREFIX + userId));
    }
    async pinUserStatusIntoServer(userId, status) {
        const rooms = await this.getWatchedRooms(userId);
        for (const roomId of rooms) {
            this.server.to(roomId).emit('userStatus', {
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
    resolveUserId(payload) {
        const userId = payload?.sub;
        if (!userId)
            throw new websockets_1.WsException('User not found');
        return userId;
    }
    signRoomId(userA, userB) {
        return JSON.stringify([userA, userB].sort());
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
};
exports.ChatsGatewayLogic = ChatsGatewayLogic;
ChatsGatewayLogic.PUBLIC_KEY_PREFIX = 'chat:e2ee:pubkey:';
ChatsGatewayLogic.ONLINE_SOCKETS_PREFIX = 'chat:online:sockets:';
ChatsGatewayLogic.WATCHED_ROOMS_PREFIX = 'chat:watched-rooms:';
exports.ChatsGatewayLogic = ChatsGatewayLogic = ChatsGatewayLogic_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        redis_adapter_2.ChatRedisAdapter,
        prisma_service_1.PrismaService])
], ChatsGatewayLogic);
//# sourceMappingURL=chats.service.js.map