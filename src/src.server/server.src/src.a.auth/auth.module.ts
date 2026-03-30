import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { JwtConfig } from '../src.b.jwt/jwt.config';
import { GithubOauth } from './auth.oauth/oauth.github';
import { GoogleOauth } from './auth.oauth/oauth.google';
import { AuthController } from './auth.controller';
import { UsersService } from '../src.a.users/users.service';
import { AuthService } from './auth.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '24h' },
    }),
  ],
  providers: [AuthService, UsersService, GoogleOauth, GithubOauth, JwtConfig],
  controllers: [AuthController],
  exports: [JwtModule, JwtConfig],
})

export class AuthModule {}