"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketModule = void 0;
const common_1 = require("@nestjs/common");
const socket_a_gateway_1 = require("./socket.a.gateway");
const socket_b_service_1 = require("./socket.b.service");
const messages_module_1 = require("../src.a.messages/messages.module");
const jwt_1 = require("@nestjs/jwt");
const jwt_extractor_1 = require("../src.b.jwt/jwt.extractor");
const redis_module_1 = require("../src.b.redis/redis.module");
let SocketModule = class SocketModule {
};
exports.SocketModule = SocketModule;
exports.SocketModule = SocketModule = __decorate([
    (0, common_1.Module)({
        imports: [
            jwt_1.JwtModule.register({
                secret: process.env.JWT_SECRET,
                signOptions: { expiresIn: '1d' },
            }),
            messages_module_1.MessagesModule,
            redis_module_1.RedisModule,
        ],
        providers: [socket_b_service_1.SocketService, socket_a_gateway_1.SocketGateway, jwt_extractor_1.JwtCheck],
    })
], SocketModule);
//# sourceMappingURL=socket.b.module.js.map