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
const websockets_1 = require("@nestjs/websockets");
const cookie = __importStar(require("cookie"));
let ChatsGatewayLogic = ChatsGatewayLogic_1 = class ChatsGatewayLogic {
    constructor(jwtService, redisAdapter) {
        this.jwtService = jwtService;
        this.redisAdapter = redisAdapter;
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
    async formattingRedisData(action, errorMessage) {
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
            client.join(userId);
            client.data.userId = userId;
            await this.addOnlineUser(userId, client.id);
            const onlineUsers = await this.getOnlineUsers();
            this.server.emit('usersOnline', onlineUsers);
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
        const userId = client.data.userId;
        if (!userId)
            return;
        await this.removeOnlineUser(userId, client.id);
        const onlineUsers = await this.getOnlineUsers();
        this.server.emit('usersOnline', onlineUsers);
    }
    getOnlineSocketsKey(userId) {
        return `${ChatsGatewayLogic_1.ONLINE_SOCKETS_PREFIX}${userId}`;
    }
    async addOnlineUser(userId, socketId) {
        const socketsKey = this.getOnlineSocketsKey(userId);
        await this.redisAdapter.redisClient
            .multi()
            .sAdd(socketsKey, socketId)
            .sAdd(ChatsGatewayLogic_1.ONLINE_USERS_KEY, userId)
            .exec();
    }
    async removeOnlineUser(userId, socketId) {
        const socketsKey = this.getOnlineSocketsKey(userId);
        await this.redisAdapter.redisClient.eval(`
        redis.call('SREM', KEYS[1], ARGV[1])

        local socketsCount = redis.call('SCARD', KEYS[1])

        if socketsCount == 0 then
          redis.call('SREM', KEYS[2], ARGV[2])
          redis.call('DEL', KEYS[1])
        end

        return socketsCount
      `, {
            keys: [
                socketsKey,
                ChatsGatewayLogic_1.ONLINE_USERS_KEY,
            ],
            arguments: [
                socketId,
                userId,
            ],
        });
    }
    async getOnlineUsers() {
        return (await this.redisAdapter.redisClient.sMembers(ChatsGatewayLogic_1.ONLINE_USERS_KEY));
    }
    resolveUserId(payload) {
        const userId = payload?.sub;
        return userId;
    }
    signRoomId(userA, userB) {
        return JSON.stringify([userA, userB].sort());
    }
    setDataIntoRedis(roomId, task) {
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
ChatsGatewayLogic.ONLINE_USERS_KEY = 'chat:online:users';
ChatsGatewayLogic.ONLINE_SOCKETS_PREFIX = 'chat:online:sockets:';
exports.ChatsGatewayLogic = ChatsGatewayLogic = ChatsGatewayLogic_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        redis_adapter_2.ChatRedisAdapter])
], ChatsGatewayLogic);
//# sourceMappingURL=socket.b.service.js.map