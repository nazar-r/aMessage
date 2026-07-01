import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import { UsersService } from '../src.a.users/users.service';
import type { AuthUser } from '../src.extensions/extensions.types/auth.types';
export declare class AuthService {
    private readonly jwtService;
    private readonly usersService;
    constructor(jwtService: JwtService, usersService: UsersService);
    signUser(profile: AuthUser): Promise<{
        access_token: string;
    }>;
    signToken(userProfile: AuthUser): string;
    setCookies(): {
        httpOnly: boolean;
        secure: boolean;
        sameSite: "lax";
        maxAge: number;
        path: string;
    };
    signCookies(res: Response, access_token: string): void;
}
