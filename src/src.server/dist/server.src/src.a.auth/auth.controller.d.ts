import { AuthService } from './auth.service';
import { Request, Response } from 'express';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    googleOauth(): Promise<void>;
    googleAuthRedirect(req: any, res: Response): Promise<void>;
    githubOauth(): Promise<void>;
    githubAuthRedirect(req: any, res: Response): Promise<void>;
    checkLogin(req: Request): {
        isLoggedIn: boolean;
        user: Express.User;
    };
}
