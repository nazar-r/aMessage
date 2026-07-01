import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { UsersService } from '../../src.a.users/users.service';
import type { AuthUser } from '../../src.extensions/extensions.types/auth.types';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
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

    const githubEmail =
      profile?.emails?.[0]?.value
      ?? profile?._json?.email
      ?? null;

    const githubName = profile?.displayName
      ?? profile?.username
      ?? profile?._json?.name
      ?? profile?._json?.login
      ?? githubEmail?.split('@')[0]
      ?? 'Unknown User';

    if (!githubId) {
      throw new UnauthorizedException('Github profile ID is missing');
    }

    return this.usersService.findOrCreateUser({
      userId: `ggl_${githubId}`,
      userEmail: githubEmail,
      userName: githubEmail,
    });
  }
}