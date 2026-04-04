import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../src.a.users/users.service';
import type { AuthUser } from "../src.extensions/extensions.types/auth.types";

@Injectable()
export class AuthService {
    constructor(
        private jwtService: JwtService,
        private usersService: UsersService,
    ) { }

    googleLogin = async (profile: AuthUser) => {
        const user = await this.usersService.findOrCreateUser(profile);
        const loginUser = () => ({
            access_token: this.jwtService.sign({
                userId: user.userId,
                name: user.userName,
                email: user.email,
            }),
        });

        return loginUser();
    };

    githubLogin = async (profile: AuthUser) => {
        const user = await this.usersService.findOrCreateUser(profile);
        const loginUser = () => ({
            access_token: this.jwtService.sign({
                userId: user.userId,
                name: user.userName,
                email: user.email ?? undefined,
            }),
        });

        return loginUser();
    };

    generateTokens = async (profile: AuthUser) => {
        const payload = {
            userId: profile.userId,
            name: profile.name,
            email: profile.email
        };

        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(payload, { expiresIn: '1d' }),
            this.jwtService.signAsync(payload, { expiresIn: '7d' })
        ]);

        console.log("ACCESS TOKEN:", accessToken);
        console.log("REFRESH TOKEN:", refreshToken);

        return { accessToken, refreshToken };
    };
}