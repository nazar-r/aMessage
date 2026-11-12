import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from '../src.c.extensions/extensions.types/types.chats';
import { WsException } from '@nestjs/websockets';
import { createAdapter } from '@socket.io/redis-adapter';
import { PrismaService } from '../src.b.prisma/prisma.service';
import { Server, Socket } from 'socket.io';
import { ChatRedisAdapter } from '../src.b.redis/redis.adapter';
import { Injectable, Logger } from '@nestjs/common';
import * as cookie from 'cookie';

@Injectable()
export class SocketService {
  private readonly useLogger = new Logger(SocketService.name);

  constructor(
    private readonly usePrisma: PrismaService,
    private readonly useJwtService: JwtService,
    private readonly useRedisAdapter: ChatRedisAdapter,
  ) { }

  async formatAction(action: () => Promise<void>, errorMessage: string): Promise<void> {
    try {
      await action();
    } catch (error) {
      this.useLogger.error(error);
      throw new WsException(errorMessage);
    }
  }

  async afterInit(server: Server) {
    server.use((client: Socket, next) => {
      const tryAction = () => {
        const rawCookie = client.handshake.headers.cookie ?? '';
        const cookies = cookie.parse(rawCookie);
        const token = cookies['access_token'];
        const payload = this.useJwtService.verify(token, {
          secret: process.env.JWT_SECRET,
        }) as JwtPayload;

        client.data.user = payload;
        next();
      }
      const catchError = (error: unknown) => {
        this.useLogger.error(error);
      }

      try { tryAction(); } catch (error) { catchError(error); }
    });

    await this.useRedisAdapter.initialize();

    server.adapter(
      createAdapter(
        this.useRedisAdapter.pubClient,
        this.useRedisAdapter.subClient,
      ),
    );
  }

  async handleConnection(client: Socket): Promise<string[] | undefined> {
    const connectUser = async () => {
      const user = client.data.user as JwtPayload | undefined;
      const userId = this.resolveUserId(user);

      client.data.userId = userId;
      client.join(userId);

      return await this.getOnlineUsers(client);
    };

    const disconnectUser = (error: unknown) => {
      this.useLogger.error(error);
      client.disconnect(true);
    };

    try { return await connectUser(); } catch (error) { disconnectUser(error); }
  }

  async handleDisconnect(client: Socket): Promise<any> {
    const userId = client.data.userId as string | undefined;
    if (!userId) return;

    await this.usePrisma.user.update({
      where: { userId },
      data: { lastSeen: new Date() },
    });

    return await this.getOnlineUsers(client);
  }

  async getOnlineUsers(client: Socket): Promise<string[]> {
    const sockets = await client.nsp.fetchSockets();
    const userIds = sockets
      .map((socket) => socket.data.userId as string | undefined)
      .filter((userId): userId is string => Boolean(userId));

    return [...new Set(userIds)];
  }

  resolveUserId(payload: JwtPayload | undefined): string {
    const userId = payload?.sub;
    return userId;
  }

  signRoomId(userA: string, userB: string): string {
    return JSON.stringify([userA, userB].sort());
  }
}