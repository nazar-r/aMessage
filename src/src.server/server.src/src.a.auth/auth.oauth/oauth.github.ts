import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-github2';
import { UsersService } from '../../src.a.users/users.service';
import type { AuthUser } from "../../src.extensions/extensions.types/auth.types";

@Injectable()
export class GithubOauth extends PassportStrategy(Strategy, 'github') {
  constructor(private readonly usersService: UsersService) {
    super({
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_CALLBACK_URL,
      scope: ['user:email'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any, done: VerifyCallback) {
    const { id, emails, displayName, username  } = profile;
    const email = emails?.[0]?.value;
    const name = displayName || username;

    if (!id) return done(new UnauthorizedException('Github profile ID is missing'), null);
    if (!email) return done(new UnauthorizedException('Email is missing in Github profile'), null);

    const prefixedId = `gt_${id}`;

    const user: AuthUser = await this.usersService.findOrCreateUser({ userId: prefixedId, email, name });

    done(null, user);
  }
}
