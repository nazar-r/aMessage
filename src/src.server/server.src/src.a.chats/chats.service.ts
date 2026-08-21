import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createAdapter } from '@socket.io/redis-adapter';
import { Server, Socket } from 'socket.io';
import { ChatRedisAdapter } from '../src.b.redis/redis.adapter';
import { PrismaService } from '../src.b.prisma/prisma.service';
import { JwtPayload, UserStatus } from '../src.extensions/extensions.types/types';
import { WsException } from '@nestjs/websockets';
import * as cookie from 'cookie';

@Injectable()
export class ChatsGatewayLogic {
  private readonly logger = new Logger(ChatsGatewayLogic.name);
  private readonly roomMessageSaveChains = new Map<string, Promise<void>>();

  private static readonly PUBLIC_KEY_PREFIX = 'chat:e2ee:pubkey:';
  private static readonly ONLINE_SOCKETS_PREFIX = 'chat:online:sockets:';
  private static readonly WATCHED_ROOMS_PREFIX = 'chat:watched-rooms:';

  private server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly redisAdapter: ChatRedisAdapter,
    private readonly usePrisma: PrismaService,
  ) { }

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
      const nextCount = await this.pinOnlineSocket(userId, client.id);

      client.join(userId);

      if (nextCount === 1) {
        await this.pinUserStatusIntoServer(userId, 'online');
      }
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
    const userId = client.data.user?.sub;

    this.logger.debug({
      userId,
      socketId: client.id,
      sockets: await this.redisAdapter.redisClient.sMembers(
        ChatsGatewayLogic.ONLINE_SOCKETS_PREFIX + userId,
      ),
    });

    if (!userId) return;

    const nextCount = await this.unpinOnlineSocket(userId, client.id);

    this.logger.debug({
      userId,
      nextCount,
    });

    if (nextCount === 0) {
      await this.pinUserStatusIntoServer(userId, 'offline');
    }
  }
  async ensureRoomExists(roomId: string, userId: string, peerId: string) {
    const existsKey = `room:exists:${roomId}`;
    const lockKey = `room:lock:${roomId}`;

    const cached = await this.redisAdapter.redisClient.get(existsKey);
    if (cached) return;

    const lock = await this.redisAdapter.redisClient.set(lockKey, '1', {
      NX: true,
      EX: 5,
    });

    if (!lock) return;

    try {
      const cachedAgain = await this.redisAdapter.redisClient.get(existsKey);
      if (cachedAgain) return;

      await this.usePrisma.$transaction(async (tx) => {
        const existingRoom = await tx.room.findUnique({
          where: { roomId },
          select: { roomId: true },
        });

        if (!existingRoom) {
          await tx.room.create({
            data: { roomId },
          });

          await tx.roomUser.createMany({
            data: [
              { roomId, userId },
              { roomId, userId: peerId },
            ],
            skipDuplicates: true,
          });
        }
      });

      await this.redisAdapter.redisClient.set(existsKey, '1');
    } finally {
      await this.redisAdapter.redisClient.del(lockKey);
    }
  }

  async pinOnlineSocket(userId: string, socketId: string): Promise<number> {
    const key = ChatsGatewayLogic.ONLINE_SOCKETS_PREFIX + userId;
    await this.redisAdapter.redisClient.sAdd(key, socketId);

    return (await this.redisAdapter.redisClient.sCard(key)) as number;
  }

  async unpinOnlineSocket(userId: string, socketId: string): Promise<number> {
    const key = ChatsGatewayLogic.ONLINE_SOCKETS_PREFIX + userId;
    await this.redisAdapter.redisClient.sRem(key, socketId);

    const count = (await this.redisAdapter.redisClient.sCard(key)) as number;
    count === 0 &&
      await this.redisAdapter.redisClient.del(key);

    return count;
  }

  async checkUserOnlineStatus(userId: string): Promise<boolean> {
    const count = (await this.redisAdapter.redisClient.sCard(
      ChatsGatewayLogic.ONLINE_SOCKETS_PREFIX + userId,
    )) as number;

    return count > 0;
  }

  async addWatchedRoom(userId: string, roomId: string): Promise<void> {
    await this.redisAdapter.redisClient.sAdd(ChatsGatewayLogic.WATCHED_ROOMS_PREFIX + userId, roomId);
  }

  async getWatchedRooms(userId: string): Promise<string[]> {
    return (await this.redisAdapter.redisClient.sMembers(
      ChatsGatewayLogic.WATCHED_ROOMS_PREFIX + userId,
    )) as string[];
  }

  async pinUserStatusIntoServer(userId: string, status: UserStatus): Promise<void> {
    const rooms = await this.getWatchedRooms(userId);

    for (const roomId of rooms) {
      this.server.to(roomId).emit('userStatus', {
        userId,
        status,
      });
    }
  }

  async getPublicKey(userId: string): Promise<string | undefined> {
    return (await this.redisAdapter.redisClient.get(
      ChatsGatewayLogic.PUBLIC_KEY_PREFIX + userId,
    )) as string | undefined;
  }

  async setPublicKeyIntoRedis(userId: string, publicKey: string): Promise<void> {
    await this.redisAdapter.redisClient.set(ChatsGatewayLogic.PUBLIC_KEY_PREFIX + userId, publicKey);
  }

  normalizePublicKey(publicKey: string): string {
    const normalized = publicKey?.trim();

    if (!normalized) throw new WsException('Invalid public key');

    const decoded = Buffer.from(normalized, 'base64');

    if (decoded.length !== 32) {
      throw new WsException('Invalid public key length');
    }

    return normalized;
  }

  resolveUserId(payload: JwtPayload | undefined): string {
    const userId = payload?.sub;

    if (!userId) throw new WsException('User not found');
    return userId;
  }

  signRoomId(userA: string, userB: string): string {
    return JSON.stringify([userA, userB].sort());
  }

  setDataIntoRedis(roomId: string, task: () => Promise<void>) {
    const previous = this.roomMessageSaveChains.get(roomId) ?? Promise.resolve();
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