import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { createClient } from 'redis';
import * as session from 'express-session';
import * as passport from 'passport';
import * as cookieParser from 'cookie-parser';
import * as connectRedis from 'connect-redis';
import 'reflect-metadata';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.set('trust proxy', 1);
  app.use(cookieParser());

  const redisClient = createClient({
    url: process.env.REDIS_URL as string,
  });

  redisClient.on('error', (err) => {
    console.error('Redis error:', err);
  });

  await redisClient.connect();
  const RedisStore = connectRedis(session);

  app.use(
    session({
      store: new RedisStore({ client: redisClient, prefix: 'sess:' }),
      secret: process.env.JWT_SECRET as string,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 24,
        path: '/',
      },
    }),
  );

  app.use(passport.initialize());
  app.use(passport.session());

  app.enableCors({
    origin: 'https://amessage.site',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();