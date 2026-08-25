import { Module } from '@nestjs/common';
import { ChatsGateway } from './socket.b.gateway';
import { ChatsGatewayLogic } from './socket.b.service';
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
  providers: [ChatsGatewayLogic, ChatsGateway, JwtCheck],
})
export class ChatModule { }