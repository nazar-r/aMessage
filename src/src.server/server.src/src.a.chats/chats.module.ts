import { Module } from '@nestjs/common';
import { ChatsGateway } from './chats.service';
import { JwtModule } from '@nestjs/jwt';
import { WsJwtGuard } from '../src.b.jwt/jwt.ws.config';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1d' },
    }),
  ],
  providers: [ChatsGateway, WsJwtGuard],
})
export class ChatModule {}