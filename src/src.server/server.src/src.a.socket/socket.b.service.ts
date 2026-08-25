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

    console.log('[ONLINE_USERS] afterInit', await this.getOnlineUsers());

    this.server.adapter(
      createAdapter(
        this.redisAdapter.pubClient,
        this.redisAdapter.subClient,
      ),
    );
  }

  async handleConnection(client: Socket) {
    console.log('[ONLINE_USERS] handleConnection', client.id);

    await this.connectSocket(client);
  }

  async handleDisconnect(client: Socket) {
    console.log(
      '[ONLINE_USERS] handleDisconnect',
      client.id,
      client.data.userId,
    );

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

      console.log(
        '[ONLINE_USERS] connect BEFORE',
        userId,
        await this.getOnlineUsers(),
      );

      client.join(userId);
      client.data.userId = userId;

      await this.addOnlineUser(userId);

      console.log(
        '[ONLINE_USERS] connect AFTER',
        userId,
        await this.getOnlineUsers(),
      );

      const onlineUsers = await this.getOnlineUsers();

      console.log('[ONLINE_USERS] emit', onlineUsers);

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

    console.log(
      '[ONLINE_USERS] disconnect BEFORE',
      userId,
      await this.getOnlineUsers(),
    );

    await this.removeOnlineUser(userId);

    console.log(
      '[ONLINE_USERS] disconnect AFTER',
      userId,
      await this.getOnlineUsers(),
    );

    const onlineUsers = await this.getOnlineUsers();

    console.log('[ONLINE_USERS] emit', onlineUsers);

    this.server.emit('usersOnline', onlineUsers);
  }

  async addOnlineUser(userId: string): Promise<void> {
    console.log('[ONLINE_USERS] SADD BEFORE', userId);

    const result = await this.redisAdapter.redisClient.sAdd(
      ChatsGatewayLogic.ONLINE_USERS_KEY,
      userId,
    );

    console.log('[ONLINE_USERS] SADD AFTER', userId, result);
  }

  async removeOnlineUser(userId: string): Promise<void> {
    console.log('[ONLINE_USERS] SREM BEFORE', userId);

    const result = await this.redisAdapter.redisClient.sRem(
      ChatsGatewayLogic.ONLINE_USERS_KEY,
      userId,
    );

    console.log('[ONLINE_USERS] SREM AFTER', userId, result);
  }

  async getOnlineUsers(): Promise<string[]> {
    const users = (await this.redisAdapter.redisClient.sMembers(
      ChatsGatewayLogic.ONLINE_USERS_KEY,
    )) as string[];

    console.log('[ONLINE_USERS] SMEMBERS', users);

    return users;
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