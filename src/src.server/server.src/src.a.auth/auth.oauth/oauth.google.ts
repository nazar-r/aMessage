import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oauth20';
import { UsersService } from '../../src.a.users/users.service';
import type { AuthUser } from '../../src.extensions/extensions.types/auth.types';

@Injectable()
export class GoogleOauth extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly usersService: UsersService) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_CALLBACK_URL!,
      scope: ['email', 'profile'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any): Promise<AuthUser> {
    const googleId = profile?.id;
    const email = profile?.emails?.[0]?.value;

    const name =
      profile?.displayName ??
      [profile?.name?.givenName, profile?.name?.familyName].filter(Boolean).join(' ') ??
      email?.split('@')[0] ??
      'Unknown';

    if (!googleId) {
      throw new UnauthorizedException('Google profile ID is missing');
    }

    if (!email) {
      throw new UnauthorizedException('Email is missing in Google profile');
    }

    return this.usersService.findOrCreateUser({
      userId: `ggl_${googleId}`,
      email,
      name,
    });
  }
}