import { Injectable } from '@nestjs/common';
import { PrismaService } from '../src.b.prisma/prisma.service';
import { MessageDTO } from './messages.image/messages.create.dto';

@Injectable()
export class MessagesService {
  constructor(
    private readonly usePrisma: PrismaService,
  ) { }
  async createMessage(message: {
    messageId: string;
    roomId: string;
    userId: string;
    peerId: string;
    content: string;
  }) {
    return this.usePrisma.$transaction(async (tx) => {
      await tx.room.upsert({
        where: {
          roomId: message.roomId,
        },
        update: {},
        create: {
          roomId: message.roomId,
        },
      });

      await Promise.all([
        tx.roomUser.upsert({
          where: {
            roomId_userId: {
              roomId: message.roomId,
              userId: message.userId,
            },
          },
          update: {},
          create: {
            roomId: message.roomId,
            userId: message.userId,
          },
        }),

        tx.roomUser.upsert({
          where: {
            roomId_userId: {
              roomId: message.roomId,
              userId: message.peerId,
            },
          },
          update: {},
          create: {
            roomId: message.roomId,
            userId: message.peerId,
          },
        }),
      ]);

      return tx.message.create({
        data: {
          messageId: message.messageId,
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

  findMessagesByRoom(roomId: string, options?: { take?: number; cursor?: string }) {
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
    const result = await this.usePrisma.$queryRaw`
    SELECT
      r."roomId",

      u."userId",
      u."userName",

      EXISTS (
        SELECT 1
        FROM "Contact" c
        WHERE c."userId" = ${userId}
          AND c."contactId" = u."userId"
      ) AS "isContact",

      m."messageId",
      m."userId" AS "messageUserId",
      m."content" AS "lastMessage",
      m."createdAt" AS "lastMessageCreatedAt"

    FROM "Room" r

    JOIN "RoomUser" ru
      ON ru."roomId" = r."roomId"
      AND ru."userId" <> ${userId}

    JOIN "User" u
      ON u."userId" = ru."userId"

    JOIN LATERAL (
      SELECT
        msg."messageId",
        msg."userId",
        msg."content",
        msg."createdAt"
      FROM "Message" msg
      WHERE msg."roomId" = r."roomId"
      ORDER BY msg."createdAt" DESC
      LIMIT 1
    ) m ON true

    WHERE EXISTS (
      SELECT 1
      FROM "RoomUser" ru2
      WHERE ru2."roomId" = r."roomId"
        AND ru2."userId" = ${userId}
    )

    ORDER BY m."createdAt" DESC;
  `;
    return result;
  }
  async deleteUserChat(userId: string, roomId: string) {
    const result = await this.usePrisma.room.delete({
      where: {
        roomId,
      },
    });

    return result;
  }
}