import { Module } from '@nestjs/common';
import { AuthModule } from '../src.a.auth/auth.module';
import { MessagesService } from './messages.service';

@Module({
  imports: [AuthModule],
  providers: [MessagesService],
  exports: [MessagesService]
})
export class MessagesModule {}