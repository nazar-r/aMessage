import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import cookie from '@fastify/cookie';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  await (app as any).register(cookie, {
    secret: 'cookie-key',
    parseOptions: {},
  });
 
  app.enableCors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    credentials: true,
  });

  await app.listen(3000, '0.0.0.0');
}

bootstrap();