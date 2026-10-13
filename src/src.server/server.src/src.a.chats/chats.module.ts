import { Module } from '@nestjs/common';
import { AuthModule } from '../src.a.auth/auth.module';
import { ChatsService } from './chats.service';
import { ChatsController } from './chats.controller';

@Module({
  imports: [AuthModule],
  exports: [ChatsService],
  providers: [ChatsService],
  controllers: [ChatsController]
})
export class ChatsModule {}