import { Injectable } from '@nestjs/common';
import { PrismaService } from '../src.b.prisma/prisma.service';
import type { CreatedMessage, UpdatedMessage, MessageSearch } from '../src.c.extensions/extensions.types/types.chats';

@Injectable()
export class ChatsService {
  constructor(private readonly usePrisma: PrismaService) { }

  getUserChats(userId: string) {
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
  }

  async removeUserChat(roomId: string) {
    const result = await this.usePrisma.room.delete({
      where: { roomId },
    });

    return result;
  }
}