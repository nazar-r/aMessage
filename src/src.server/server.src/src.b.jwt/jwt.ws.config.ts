import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';
import * as cookie from 'cookie';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const client: Socket = context.switchToWs().getClient<Socket>();
    const cookies = client.handshake.headers.cookie;
    if (!cookies) return false;

    const parsed = cookie.parse(cookies);
    const token = parsed['access_token'];
    if (!token) return false;

    try {
      const payload = this.jwtService.verify(token);
      client.data.user = payload;
      return true;
    } catch {
      return false;
    }
  }
}