import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';
import * as cookie from 'cookie';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const client = context.switchToWs().getClient<Socket>();

    const cookies = cookie.parse(
      client.handshake.headers.cookie ?? '',
    );

    const token = cookies.access_token;
    const payload = this.jwtService.verify(token, {
      secret: process.env.JWT_SECRET,
    });

    client.data.user = {
      sub: payload.sub,
    };

    return true;
  }
}