import { Module } from '@nestjs/common';
import { SocketGateway } from './socket.a.gateway';
import { SocketChatsGateway } from './socket.b.chats';
import { SocketService } from './socket.b.service';
import { MessagesModule } from '../src.a.messages/messages.module';
import { JwtModule } from '@nestjs/jwt';
import { JwtCheck } from '../src.b.jwt/jwt.extractor';
import { RedisModule } from '../src.b.redis/redis.module';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1d' },
    }),
    MessagesModule,
    RedisModule,
  ],
  providers: [SocketService, SocketGateway, SocketChatsGateway, JwtCheck],
})
export class SocketModule { }