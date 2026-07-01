import { UsersService } from '../../src.a.users/users.service';
import type { AuthUser } from '../../src.extensions/extensions.types/auth.types';
declare const GithubStrategy_base: new (...args: any) => any;
export declare class GithubStrategy extends GithubStrategy_base {
    private readonly usersService;
    constructor(usersService: UsersService);
    validate(accessToken: string, refreshToken: string, profile: any): Promise<AuthUser>;
}
export {};
