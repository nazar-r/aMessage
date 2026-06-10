import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersService } from '../src.a.users/users.service';
import { GoogleOauth } from './auth.oauth/oauth.google';
import { GithubOauth } from './auth.oauth/oauth.github';
import { JwtConfig } from '../src.b.jwt/jwt.config';

@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '24h' },
      }),
    }),
  ],
  providers: [AuthService, UsersService, GoogleOauth, GithubOauth, JwtConfig],
  controllers: [AuthController],
  exports: [JwtModule, JwtConfig],
})
export class AuthModule {}