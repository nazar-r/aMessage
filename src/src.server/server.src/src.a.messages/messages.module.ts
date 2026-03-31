import { Module } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { AuthModule } from '../src.a.auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [MessagesController],
  providers: [MessagesService],
})
export class MessagesModule {}