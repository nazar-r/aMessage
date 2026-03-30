import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthModule } from '../src.a.auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [UsersService],
})

export class UsersModule {}