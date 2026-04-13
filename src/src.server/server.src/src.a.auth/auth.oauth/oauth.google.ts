import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { UsersService } from '../../src.a.users/users.service';
import type { AuthUser } from "../../src.extensions/extensions.types/auth.types";

@Injectable()
export class GoogleOauth extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly usersService: UsersService) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      scope: ['email', 'profile'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any, done: VerifyCallback) {
    const { id, emails, displayName } = profile;
    const email = emails?.[0]?.value;
    const name = displayName;

    if (!id) return done(new UnauthorizedException('Google profile ID is missing'), null);
    if (!email) return done(new UnauthorizedException('Email is missing in Google profile'), null);

    const prefixedId = `ggl_${id}`;

    const user: AuthUser = await this.usersService.findOrCreateUser({ userId: prefixedId, email, name });

    done(null, user);
  }
}