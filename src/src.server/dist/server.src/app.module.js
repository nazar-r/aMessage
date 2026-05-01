"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const auth_module_1 = require("./src.a.auth/auth.module");
const users_module_1 = require("./src.a.users/users.module");
const messages_module_1 = require("./src.a.messages/messages.module");
const prisma_service_1 = require("./src.b.database/prisma.service");
const chats_service_1 = require("./src.a.chats/chats.service");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: '.env',
            }),
            users_module_1.UsersModule,
            auth_module_1.AuthModule,
            messages_module_1.MessagesModule,
        ],
        providers: [prisma_service_1.PrismaService, chats_service_1.ChatsGateway],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map