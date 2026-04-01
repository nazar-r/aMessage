import { Module } from '@nestjs/common';
import { AuthModule } from './src.a.auth/auth.module';
import { UsersModule } from './src.a.users/users.module';
import { MessagesModule } from './src.a.messages/messages.module';
import { PrismaService } from './src.b.database/prisma.service';
import { ChatsGateway } from './src.a.chats/chats.service';

@Module({
  imports: [UsersModule, AuthModule, MessagesModule],
  providers: [PrismaService, ChatsGateway],
})
export class AppModule {}
