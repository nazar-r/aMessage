import { CanActivate, ExecutionContext } from '@nestjs/common';
export declare class JwtCheck implements CanActivate {
    private readonly secretBuf;
    constructor();
    canActivate(context: ExecutionContext): boolean;
    private extractToken;
    private verifyJwtHs256;
    private decodeJsonPayload;
}
