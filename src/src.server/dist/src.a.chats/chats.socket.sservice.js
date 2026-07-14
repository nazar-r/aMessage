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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var ChatsGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatsGateway = void 0;
const common_1 = require("@nestjs/common");
const redis_adapter_1 = require("@socket.io/redis-adapter");
const jwt_1 = require("@nestjs/jwt");
const socket_io_1 = require("socket.io");
const redis_adapter_2 = require("../src.b.redis/redis.adapter");
const chats_service_1 = require("./chats.service");
const websockets_1 = require("@nestjs/websockets");
const cookie = __importStar(require("cookie"));
let ChatsGateway = ChatsGateway_1 = class ChatsGateway {
    constructor(jwtService, chatsGatewayLogic, redisAdapter) {
        this.jwtService = jwtService;
        this.chatsGatewayLogic = chatsGatewayLogic;
        this.redisAdapter = redisAdapter;
        this.logger = new common_1.Logger(ChatsGateway_1.name);
    }
    async afterInit() {
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
        this.chatsGatewayLogic.setServer(this.server);
    }
    async handleConnection(client) {
        await this.chatsGatewayLogic.connectSocket(client);
    }
    async handleDisconnect(client) {
        await this.chatsGatewayLogic.disconnectSocket(client);
    }
    async handleJoinRoom(client, payload) {
        return await this.chatsGatewayLogic.handleJoinRoom(client, payload);
    }
    async setPublicKey(client, payload) {
        return await this.chatsGatewayLogic.setPublicKey(client, payload);
    }
    async requestPeerPublicKey(client) {
        return await this.chatsGatewayLogic.requestPeerPublicKey(client);
    }
    async createMessage(client, payload) {
        return await this.chatsGatewayLogic.createMessage(client, payload);
    }
    async updateUserMessage(client, payload) {
        return await this.chatsGatewayLogic.updateUserMessage(client, payload);
    }
    async removeUserMessage(client, payload) {
        return await this.chatsGatewayLogic.removeUserMessage(client, payload);
    }
};
exports.ChatsGateway = ChatsGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], ChatsGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('joinRoom'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatsGateway.prototype, "handleJoinRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('e2ee:publicKey'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatsGateway.prototype, "setPublicKey", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('e2ee:requestPeerPublicKey'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], ChatsGateway.prototype, "requestPeerPublicKey", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('message'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatsGateway.prototype, "createMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('updateMessage'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatsGateway.prototype, "updateUserMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('removeMessage'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], ChatsGateway.prototype, "removeUserMessage", null);
exports.ChatsGateway = ChatsGateway = ChatsGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: 'http://localhost:5174',
            credentials: true,
        },
    }),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        chats_service_1.ChatsGatewayLogic,
        redis_adapter_2.ChatRedisAdapter])
], ChatsGateway);
//# sourceMappingURL=chats.socket.sservice.js.map