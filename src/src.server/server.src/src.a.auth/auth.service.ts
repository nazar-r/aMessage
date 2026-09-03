import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import { UsersService } from '../src.a.users/users.service';
import type { AuthUser } from '../src.extensions/extensions.types/auth.types';

@Injectable()
export class AuthService {
    constructor(
        private readonly jwtService: JwtService,
        private readonly usersService: UsersService) { }

    async signUser(profile: AuthUser) {
        const user = await this.usersService.findOrCreateUser(profile);
        const access_token = this.signToken(user);

        return { access_token };
    };

    signToken(userProfile: AuthUser): string {
        return this.jwtService.sign(
            { sub: userProfile.userId },
            { expiresIn: '48h' },
        );
    };

    setCookies() {
        return {
            httpOnly: true,
            secure: process.env.COOKIE_SECURE === 'true',
            sameSite: 'lax' as const,
            maxAge: 1000 * 60 * 60 * 24 * 2,
            path: '/',
        };
    };

    signCookies(res: Response, access_token: string) {
        res.cookie('access_token', access_token, this.setCookies());
    };
}