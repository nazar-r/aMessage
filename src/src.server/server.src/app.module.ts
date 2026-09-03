import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './src.a.auth/auth.module';
import { RedisModule } from './src.b.redis/redis.module';
import { UsersModule } from './src.a.users/users.module';
import { SearchModule } from './src.a.search/search.module';
import { MessagesModule } from './src.a.messages/messages.module';
import { PrismaModule } from './src.b.prisma/prisma.module';
import { ChatModule } from './src.a.socket/socket.a.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ChatModule,
    SearchModule,
    PrismaModule,
    UsersModule,
    AuthModule,
    RedisModule,
    MessagesModule,
  ],

})
export class AppModule { }