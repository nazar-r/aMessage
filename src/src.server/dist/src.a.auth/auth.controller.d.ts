import { AuthService } from './auth.service';
import { Request, Response } from 'express';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    googleOauth(): void;
    githubOauth(): void;
    googleRedirect(req: Request, res: Response): Promise<void>;
    githubRedirect(req: Request, res: Response): Promise<void>;
    checkLogin(req: any): {
        isLoggedIn: boolean;
        user: any;
    };
    health(): {
        status: string;
    };
}
