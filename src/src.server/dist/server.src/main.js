"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const redis_1 = require("redis");
const connect_redis_1 = require("connect-redis");
const express_session_1 = require("express-session");
const passport_1 = require("passport");
const cookie_parser_1 = require("cookie-parser");
require("reflect-metadata");
const bootstrap = async () => {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.set('trust proxy', 1);
    app.use((0, cookie_parser_1.default)());
    const redisClient = (0, redis_1.createClient)({
        url: process.env.REDIS_URL,
    });
    redisClient.on('error', console.error);
    await redisClient.connect();
    const store = new connect_redis_1.RedisStore({
        client: redisClient,
        prefix: 'sess:',
    });
    app.use((0, express_session_1.default)({
        store,
        secret: process.env.JWT_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            secure: true,
            sameSite: 'lax',
            maxAge: 1000 * 60 * 60 * 24,
        },
    }));
    app.use(passport_1.default.initialize());
    app.use(passport_1.default.session());
    app.enableCors({
        origin: process.env.FRONTEND_ORIGIN_URL,
        credentials: true,
    });
    await app.listen(process.env.PORT ?? 3000);
};
bootstrap();
//# sourceMappingURL=main.js.map