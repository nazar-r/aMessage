import { Injectable } from '@nestjs/common';
import { PrismaService } from '../src.b.prisma/prisma.service';
import { MessageDTO } from './messages.image/messages.create.dto';
import { ChatRedisAdapter } from '../src.b.redis/redis.adapter';

@Injectable()
export class MessagesService {
  constructor(
    private readonly usePrisma: PrismaService,
    private readonly redisAdapter: ChatRedisAdapter,
  ) {}

  createMessage(message: MessageDTO) {
    return this.usePrisma.message.create({
      data: {
        roomId: message.roomId,
        userId: message.userId,
        content: message.content,
      },
      select: {
        messageId: true,
        roomId: true,
        userId: true,
        content: true,
        createdAt: true,
      },
    });
  }

  updateMessage(message: { messageId: string; content: string }) {
    return this.usePrisma.message.update({
      where: {
        messageId: message.messageId,
      },
      data: {
        content: message.content,
      },
    });
  }

  findMessagesByRoom(
    roomId: string,
    options?: { take?: number; cursor?: string },
  ) {
    return this.usePrisma.message.findMany({
      where: { roomId },
      orderBy: { createdAt: 'desc' },
      take: options?.take,
      ...(options?.cursor && {
        cursor: { messageId: options.cursor },
        skip: 1,
      }),
      select: {
        messageId: true,
        content: true,
        userId: true,
        createdAt: true,
      },
    });
  }

  removeMessage(messageId: string, userId: string) {
    return this.usePrisma.message.deleteMany({
      where: {
        userId,
        messageId,
      },
    });
  }

  findMessages(userId: string) {
    return this.usePrisma.message.findMany({
      where: { userId },
    });
  }

  async findUserChats(userId: string) {
    return this.usePrisma.$queryRaw`
      SELECT
        r."roomId",
        u."userId",
        u."userName",
        EXISTS (
          SELECT 1
          FROM "Contact" c
          WHERE c."userId" = ${userId}
            AND c."contactId" = u."userId"
        ) AS "isContact"
      FROM "Room" r
      JOIN "RoomUser" ru
        ON ru."roomId" = r."roomId"
      JOIN "User" u
        ON u."userId" = ru."userId"
      WHERE r."roomId" IN (
        SELECT ru2."roomId"
        FROM "RoomUser" ru2
        WHERE ru2."userId" = ${userId}
      )
      AND u."userId" <> ${userId};
    `;
  }

  async deleteUserChat(userId: string, roomId: string) {
    const result = await this.usePrisma.room.delete({
      where: {
        roomId,
      },
    });

    await Promise.all([
      this.redisAdapter.redisClient.del(`room:exists:${roomId}`),
      this.redisAdapter.redisClient.del(`room:lock:${roomId}`),
    ]);

    return result;
  }
}