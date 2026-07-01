import { AuthService } from './auth.service';
import { Request, Response } from 'express';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    googleOauth(): void;
    githubOauth(): void;
    googleRedirect(req: Request, res: Response): Promise<void>;
    githubRedirect(req: Request, res: Response): Promise<void>;
    checkLogin(req: Request): {
        isLoggedIn: boolean;
        user: Express.User;
    };
    health(): {
        status: string;
    };
}
