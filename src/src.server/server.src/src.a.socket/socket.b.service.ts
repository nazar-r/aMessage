import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createAdapter } from '@socket.io/redis-adapter';
import { Server, Socket } from 'socket.io';
import { ChatRedisAdapter } from '../src.b.redis/redis.adapter';
import { JwtPayload } from '../src.extensions/extensions.types/types';
import { WsException } from '@nestjs/websockets';
import * as cookie from 'cookie';

@Injectable()
export class ChatsGatewayLogic {
  private readonly logger = new Logger(ChatsGatewayLogic.name);
  private readonly roomMessageSaveChains = new Map<string, Promise<void>>();

  private static readonly ONLINE_USERS_KEY = 'chat:online:users';
  private static readonly ONLINE_SOCKETS_PREFIX = 'chat:online:sockets:';

  private server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly redisAdapter: ChatRedisAdapter,
  ) {}

  async afterInit(server: Server) {
    this.server = server;

    this.server.use((client: Socket, next) => {
      try {
        const rawCookie = client.handshake.headers.cookie ?? '';
        const cookies = cookie.parse(rawCookie);
        const token = cookies['access_token'];

        if (!token) {
          return next(new Error('Unauthorized'));
        }

        const payload = this.jwtService.verify(token, {
          secret: process.env.JWT_SECRET,
        }) as JwtPayload;

        client.data.user = payload;

        next();
      } catch (error) {
        this.logger.error(error);
        next(new Error('Unauthorized'));
      }
    });

    await this.redisAdapter.initialize();

    this.server.adapter(
      createAdapter(
        this.redisAdapter.pubClient,
        this.redisAdapter.subClient,
      ),
    );
  }

  async handleConnection(client: Socket) {
    await this.connectSocket(client);
  }

  async handleDisconnect(client: Socket) {
    await this.disconnectSocket(client);
  }

  async formattingRedisData(
    action: () => Promise<void>,
    errorMessage: string,
  ): Promise<void> {
    try {
      await action();
    } catch (error) {
      this.logger.error(error);
      throw new WsException(errorMessage);
    }
  }

  async connectSocket(client: Socket) {
    const connectUser = async () => {
      const user = client.data.user as JwtPayload | undefined;
      const userId = this.resolveUserId(user);

      client.join(userId);
      client.data.userId = userId;

      await this.addOnlineUser(userId, client.id);

      const onlineUsers = await this.getOnlineUsers();

      this.server.emit('usersOnline', onlineUsers);
    };

    const disconnectUser = (error: unknown) => {
      this.logger.error(error);
      client.disconnect(true);
    };

    try {
      await connectUser();
    } catch (error) {
      disconnectUser(error);
    }
  }

  async disconnectSocket(client: Socket) {
    const userId = client.data.userId as string | undefined;

    if (!userId) return;

    await this.removeOnlineUser(userId, client.id);

    const onlineUsers = await this.getOnlineUsers();

    this.server.emit('usersOnline', onlineUsers);
  }

  private getOnlineSocketsKey(userId: string): string {
    return `${ChatsGatewayLogic.ONLINE_SOCKETS_PREFIX}${userId}`;
  }

  async addOnlineUser(userId: string, socketId: string): Promise<void> {
    const socketsKey = this.getOnlineSocketsKey(userId);

    await this.redisAdapter.redisClient
      .multi()
      .sAdd(socketsKey, socketId)
      .sAdd(ChatsGatewayLogic.ONLINE_USERS_KEY, userId)
      .exec();
  }

  async removeOnlineUser(
    userId: string,
    socketId: string,
  ): Promise<void> {
    const socketsKey = this.getOnlineSocketsKey(userId);

    await this.redisAdapter.redisClient.eval(
      `
        redis.call('SREM', KEYS[1], ARGV[1])

        local socketsCount = redis.call('SCARD', KEYS[1])

        if socketsCount == 0 then
          redis.call('SREM', KEYS[2], ARGV[2])
          redis.call('DEL', KEYS[1])
        end

        return socketsCount
      `,
      {
        keys: [
          socketsKey,
          ChatsGatewayLogic.ONLINE_USERS_KEY,
        ],
        arguments: [
          socketId,
          userId,
        ],
      },
    );
  }

  async getOnlineUsers(): Promise<string[]> {
    return (await this.redisAdapter.redisClient.sMembers(
      ChatsGatewayLogic.ONLINE_USERS_KEY,
    )) as string[];
  }

  resolveUserId(payload: JwtPayload | undefined): string {
    const userId = payload?.sub;

    return userId;
  }

  signRoomId(userA: string, userB: string): string {
    return JSON.stringify([userA, userB].sort());
  }

  setDataIntoRedis(roomId: string, task: () => Promise<void>) {
    const previous =
      this.roomMessageSaveChains.get(roomId) ?? Promise.resolve();

    const current = previous.catch(() => undefined).then(task);

    const tracked = current.then(
      () => undefined,
      () => undefined,
    );

    this.roomMessageSaveChains.set(roomId, tracked);

    void tracked.finally(() => {
      if (this.roomMessageSaveChains.get(roomId) === tracked) {
        this.roomMessageSaveChains.delete(roomId);
      }
    });
  }
}