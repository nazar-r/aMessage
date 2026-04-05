import { Module } from '@nestjs/common';
import { ChatsGateway } from './chats.service';
import { MessagesService } from '../src.a.messages/messages.service';
import { JwtModule } from '@nestjs/jwt';
import { WsJwtGuard } from '../src.b.jwt/jwt.ws.config';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1d' },
    }),
    
    MessagesService
  ],
  providers: [ChatsGateway, WsJwtGuard],
})
export class ChatModule { }