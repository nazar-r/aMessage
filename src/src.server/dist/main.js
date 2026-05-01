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
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.set('trust proxy', 1);
    app.use(cookieParser());
    app.use((req, res, next) => {
        const ip = req.headers['x-forwarded-for']?.toString().split(',')[0] ||
            req.headers['x-real-ip'] ||
            req.ip;
        console.log(`[IP] ${ip} → ${req.method} ${req.url}`);
        next();
    });
    const redisClient = (0, redis_1.createClient)({
        url: process.env.REDIS_URL,
    });
    redisClient.on('error', (err) => {
        console.error('Redis error:', err);
    });
    await redisClient.connect();
    const RedisStore = connectRedis(session);
    app.use(session({
        store: new RedisStore({ client: redisClient, prefix: 'sess:' }),
        secret: process.env.JWT_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            maxAge: 1000 * 60 * 60 * 24,
            path: '/',
        },
    }));
    app.use(passport.initialize());
    app.use(passport.session());
    app.enableCors({
        origin: process.env.FRONTEND_ORIGIN_URL,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    });
    await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
//# sourceMappingURL=main.js.map