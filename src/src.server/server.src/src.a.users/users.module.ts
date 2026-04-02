import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { AuthModule } from '../src.a.auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [UsersService],
  controllers: [UsersController],
})

export class UsersModule { }