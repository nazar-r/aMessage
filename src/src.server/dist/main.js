"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const redis_1 = require("redis");
const session = require("express-session");
const passport = require("passport");
const cookieParser = require("cookie-parser");
const connectRedis = require("connect-redis");
require("reflect-metadata");
const bootstrap = async () => {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const RedisStore = connectRedis(session);
    const redisClient = (0, redis_1.createClient)({ url: process.env.REDIS_URL });
    redisClient.on('error', (err) => { console.error('Redis error:', err); });
    await redisClient.connect();
    app.set('trust proxy', 1);
    app.use(session({
        store: new RedisStore({ client: redisClient, prefix: 'sess:' }),
        secret: process.env.JWT_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            secure: process.env.COOKIE_SECURE === 'true',
            sameSite: 'lax',
            maxAge: 1000 * 60 * 60 * 24,
            path: '/',
        },
    }));
    app.use(cookieParser());
    app.use(passport.initialize());
    app.use(passport.session());
    app.enableCors({
        origin: process.env.FRONTEND_ORIGIN_URL,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    });
    await app.listen(process.env.PORT ?? 3001);
};
bootstrap();
//# sourceMappingURL=main.js.map