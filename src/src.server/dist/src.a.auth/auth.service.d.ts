import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../src.a.users/users.service';
import type { AuthUser } from "../src.extensions/extensions.types/auth.types";
export declare class AuthService {
    private jwtService;
    private usersService;
    constructor(jwtService: JwtService, usersService: UsersService);
    googleLogin: (profile: AuthUser) => Promise<{
        access_token: string;
    }>;
    githubLogin: (profile: AuthUser) => Promise<{
        access_token: string;
    }>;
    generateTokens: (profile: AuthUser) => Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
}
