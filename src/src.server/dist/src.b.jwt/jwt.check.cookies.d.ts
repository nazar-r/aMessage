import { CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
export declare class JwtCheckCookies implements CanActivate {
    private jwtService;
    constructor(jwtService: JwtService);
    canActivate(context: ExecutionContext): boolean;
}
