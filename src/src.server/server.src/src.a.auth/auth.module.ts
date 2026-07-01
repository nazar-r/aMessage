import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../src.a.users/users.module';
import { GoogleStrategy } from './auth.oauth/oauth.google';
import { GithubStrategy } from './auth.oauth/oauth.github';
import { JwtPassportExtractor } from '../src.b.jwt/jwt.extractor.passport';

@Module({
  imports: [
    UsersModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
      }),
    }),
  ],
  providers: [AuthService, GoogleStrategy, GithubStrategy, JwtPassportExtractor],
  controllers: [AuthController],
  exports: [JwtModule, JwtPassportExtractor],
})
export class AuthModule {}