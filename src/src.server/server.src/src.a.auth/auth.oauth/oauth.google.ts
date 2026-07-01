import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oauth20';
import { UsersService } from '../../src.a.users/users.service';
import type {AuthUser } from '../../src.extensions/extensions.types/auth.types';
// import { randomUUID } from 'crypto';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly usersService: UsersService) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_CALLBACK_URL!,
      scope: ['email', 'profile'],
      passReqToCallback: false,
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any): Promise<AuthUser> {
    const googleId = profile?.id;
    const googleEmail = profile?.emails?.[0]?.value;

    const googleName =
      profile?.displayName
      ?? [profile?.name?.givenName, profile?.name?.familyName].filter(Boolean).join(' ')
      ?? googleEmail?.split('@')[0]
      ?? 'Unknown User';

    if (!googleId) {
      throw new UnauthorizedException('Google profile ID is missing');
    }

    return this.usersService.findOrCreateUser({
      userId: `ggl_${googleId}`,
      userEmail: googleEmail,
      userName: googleName,
    });
  }
}