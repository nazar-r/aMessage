import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../src.a.auth/auth.module';
import { RedisModule } from '../src.b.redis/redis.module';
import { UsersModule } from '../src.a.users/users.module';
import { MessagesModule } from '../src.a.messages/messages.module';
import { PrismaModule } from '../src.b.prisma/prisma.module';
import { ChatsGateway } from '../src.a.chats/chats.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    UsersModule,
    AuthModule,
    RedisModule,
    MessagesModule,
  ],
  providers: [ChatsGateway],
})
export class AppModule { }