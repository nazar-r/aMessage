import { Injectable } from '@nestjs/common';
import { PrismaService } from '../src.b.prisma/prisma.service';
import type { CreatedMessage, UpdatedMessage, MessageSearch } from '../src.c.extensions/extensions.types/types.chats';

@Injectable()
export class MessagesService {
  constructor(private readonly usePrisma: PrismaService) { }

  async createMessage(message: CreatedMessage) {
    return this.usePrisma.$transaction(async (tx) => {
      await tx.room.upsert({
        where: { roomId: message.roomId },
        update: {},
        create: { roomId: message.roomId },
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

  updateMessage(message: UpdatedMessage) {
    return this.usePrisma.message.update({
      where: { messageId: message.messageId },
      data: { content: message.content },
    });
  }

  removeMessage(messageId: string, userId: string) {
    return this.usePrisma.message.deleteMany({
      where: { userId, messageId },
    });
  }

  getMessages(userId: string) {
    return this.usePrisma.message.findMany({
      where: { userId },
    });
  }

  getMessagesByRoom(roomId: string, options?: MessageSearch) {
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
}