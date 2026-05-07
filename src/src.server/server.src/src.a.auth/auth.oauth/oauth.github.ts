import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { UsersService } from '../../src.a.users/users.service';
import type { AuthUser } from '../../src.extensions/extensions.types/auth.types';

@Injectable()
export class GithubOauth extends PassportStrategy(Strategy, 'github') {
  constructor(private readonly usersService: UsersService) {
    super({
      clientID: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      callbackURL: process.env.GITHUB_CALLBACK_URL!,
      scope: ['user:email'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any): Promise<AuthUser> {
    const githubId = profile?.id;

    const email =
      profile?.emails?.[0]?.value ||
      profile?._json?.email ||
      null;

    const name =
      profile?.displayName ||
      profile?.username ||
      profile?._json?.name ||
      profile?._json?.login ||
      email?.split('@')[0] ||
      'Unknown';

    if (!githubId) {
      throw new UnauthorizedException('Github profile ID is missing');
    }

    if (!email) {
      throw new UnauthorizedException('Email is missing in Github profile');
    }

    return this.usersService.findOrCreateUser({
      userId: `gt_${githubId}`,
      email,
      name,
    });
  }
}