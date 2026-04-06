import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { UsersService } from '../../src.a.users/users.service';
declare const GoogleOauth_base: new (...args: any[]) => Strategy;
export declare class GoogleOauth extends GoogleOauth_base {
    private readonly usersService;
    constructor(usersService: UsersService);
    validate(accessToken: string, refreshToken: string, profile: any, done: VerifyCallback): Promise<void>;
}
export {};
