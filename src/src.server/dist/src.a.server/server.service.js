"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const server_module_1 = require("./server.module");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
require("reflect-metadata");
const bootstrap = async () => {
    const app = await core_1.NestFactory.create(server_module_1.AppModule);
    app.set('trust proxy', 1);
    app.use((0, cookie_parser_1.default)());
    app.enableCors({
        origin: process.env.FRONTEND_ORIGIN_URL,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    });
    await app.listen(process.env.PORT ?? 3001);
};
bootstrap();
//# sourceMappingURL=server.service.js.map