import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createAdapter } from '@socket.io/redis-adapter';
import { Server, Socket } from 'socket.io';
import { ChatRedisAdapter } from '../src.b.redis/redis.adapter';
import { PrismaService } from '../src.b.prisma/prisma.service';
import { JwtPayload } from '../src.extensions/extensions.types/types';
import { WsException } from '@nestjs/websockets';
import * as cookie from 'cookie';

@Injectable()
export class ChatsGatewayLogic {
  private readonly logger = new Logger(ChatsGatewayLogic.name);
  private readonly roomMessageSaveChains = new Map<string, Promise<void>>();

  private static readonly PUBLIC_KEY_PREFIX = 'chat:e2ee:pubkey:';
  private static readonly ONLINE_USERS_KEY = 'online-users';

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

  async connectSocket(client: Socket) {
    try {
      const user = client.data.user as JwtPayload | undefined;
      const userId = this.resolveUserId(user);

      await this.redisAdapter.redisClient.sAdd(
        'online-users',
        userId,
      );

      client.join(userId);
    } catch (error) {
      this.logger.error(error);
      client.disconnect(true);
    }
  }

  async disconnectSocket(client: Socket) {
    const user = client.data.user as JwtPayload | undefined;
    const userId = this.resolveUserId(user);

    await this.redisAdapter.redisClient.sRem(
      'online-users',
      userId,
    );

    const peerId = client.data.peerId as string | undefined;

    if (!peerId) return;

    this.server.to(peerId).emit('userStatus', {
      userId,
      status: 'offline',
    });
  }

  async checkUserOnlineStatus(userId: string): Promise<any> {
    return this.redisAdapter.redisClient.sIsMember(
      'online-users',
      userId,
    );
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

  async ensureRoomExists(
    roomId: string,
    userId: string,
    peerId: string,
  ) {
    const existsKey = `room:exists:${roomId}`;
    const lockKey = `room:lock:${roomId}`;

    const cached = await this.redisAdapter.redisClient.get(existsKey);

    if (cached) {
      return;
    }

    const lock = await this.redisAdapter.redisClient.set(lockKey, '1', {
      NX: true,
      EX: 5,
    });

    if (!lock) {
      return;
    }

    try {
      const cachedAgain =
        await this.redisAdapter.redisClient.get(existsKey);

      if (cachedAgain) {
        return;
      }

      await this.usePrisma.$transaction(async (tx) => {
        const existingRoom = await tx.room.findUnique({
          where: {
            roomId,
          },
          select: {
            roomId: true,
          },
        });

        if (!existingRoom) {
          await tx.room.create({
            data: {
              roomId,
            },
          });

          await tx.roomUser.createMany({
            data: [
              {
                roomId,
                userId,
              },
              {
                roomId,
                userId: peerId,
              },
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

  async getPublicKey(userId: string): Promise<string | undefined> {
    return (await this.redisAdapter.redisClient.get(
      ChatsGatewayLogic.PUBLIC_KEY_PREFIX + userId,
    )) as string | undefined;
  }

  async setPublicKeyIntoRedis(
    userId: string,
    publicKey: string,
  ): Promise<void> {
    await this.redisAdapter.redisClient.set(
      ChatsGatewayLogic.PUBLIC_KEY_PREFIX + userId,
      publicKey,
    );
  }

  normalizePublicKey(publicKey: string): string {
    const normalized = publicKey?.trim();

    if (!normalized) {
      throw new WsException('Invalid public key');
    }

    const decoded = Buffer.from(normalized, 'base64');

    if (decoded.length !== 32) {
      throw new WsException('Invalid public key length');
    }

    return normalized;
  }

  resolveUserId(payload: JwtPayload | undefined): string {
    const userId = payload?.sub;

    if (!userId) {
      throw new WsException('User not found');
    }

    return userId;
  }

  signRoomId(userA: string, userB: string): string {
    return JSON.stringify([userA, userB].sort());
  }

  setDataIntoRedis(
    roomId: string,
    task: () => Promise<void>,
  ) {
    const previous =
      this.roomMessageSaveChains.get(roomId) ?? Promise.resolve();

    const current = previous
      .catch(() => undefined)
      .then(task);

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