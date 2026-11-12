import { Module } from '@nestjs/common';
import { JwtCheck } from '../src.b.jwt/jwt.extractor';
import { JwtModule } from '@nestjs/jwt';
import { RedisModule } from '../src.b.redis/redis.module';
import { ChatsGateway } from './socket.gateway.chats';
import { SocketGateway } from './socket.gateway.connections';
import { SocketService } from './socket.service';
import { MessagesModule } from '../src.a.messages/messages.module';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1d' },
    }),
    MessagesModule,
    RedisModule,
  ],
  providers: [SocketService, SocketGateway, ChatsGateway, JwtCheck],
})
export class SocketModule { }