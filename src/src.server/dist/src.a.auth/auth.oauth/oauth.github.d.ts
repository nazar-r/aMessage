import { VerifyCallback } from 'passport-github2';
import { UsersService } from '../../src.a.users/users.service';
declare const GithubOauth_base: new (...args: any[]) => any;
export declare class GithubOauth extends GithubOauth_base {
    private readonly usersService;
    constructor(usersService: UsersService);
    validate(accessToken: string, refreshToken: string, profile: any, done: VerifyCallback): Promise<any>;
}
export {};
