"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatModule = void 0;
const common_1 = require("@nestjs/common");
const chats_service_1 = require("./chats.service");
const messages_service_1 = require("../src.a.messages/messages.service");
const jwt_1 = require("@nestjs/jwt");
const jwt_ws_config_1 = require("../src.b.jwt/jwt.ws.config");
let ChatModule = class ChatModule {
};
exports.ChatModule = ChatModule;
exports.ChatModule = ChatModule = __decorate([
    (0, common_1.Module)({
        imports: [
            jwt_1.JwtModule.register({
                secret: process.env.JWT_SECRET,
                signOptions: { expiresIn: '1d' },
            }),
            messages_service_1.MessagesService
        ],
        providers: [chats_service_1.ChatsGateway, jwt_ws_config_1.WsJwtGuard],
    })
], ChatModule);
//# sourceMappingURL=chats.module.js.map