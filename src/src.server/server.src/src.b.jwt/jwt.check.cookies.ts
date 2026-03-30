import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class checkJwtCookies implements CanActivate {
  constructor(private jwtService: JwtService) { }

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const token = req.cookies?.access_token;

    const payload = token
      ? (() => {
        try {
          return this.jwtService.verify(token, { secret: process.env.JWT_SECRET });
        } catch {
          throw new UnauthorizedException();
        }
      })()
      : (() => { throw new UnauthorizedException(); })();

    payload
      ? (req.user = payload)
      : (() => { throw new UnauthorizedException(); })();

    return true;
  }
}