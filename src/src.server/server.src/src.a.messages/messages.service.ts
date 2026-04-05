import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { MessageDTO } from './messages.image/messages.create.dto';

@Injectable()
export class MessagesService {
  private prisma = new PrismaClient();

  async create(messageImage: MessageDTO) {
    return this.prisma.$transaction(async (tx) => {
      await tx.roomUser.upsert({
        where: {
          roomId_userId: {
            roomId: messageImage.roomId,
            userId: messageImage.userId,
          },
        },
        update: {},
        create: {
          roomId: messageImage.roomId,
          userId: messageImage.userId,
        },
      });

      return tx.message.create({
        data: {
          roomId: messageImage.roomId,
          userId: messageImage.userId,
          content: messageImage.content,
        },
      });
    });
  }

  update(messageImage: MessageDTO) {
    return this.prisma.message.updateMany({
      where: {
        userId: messageImage.userId,
        roomId: messageImage.roomId,
      },

      data: {
        content: messageImage.content,
      },
    });
  }

  findMessagesByRoom(
    roomId: string,
    options?: {
      take?: number;
      cursor?: string;
    }
  ) {
    return this.prisma.message.findMany({
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

  findMessages(userId: string) {
    return this.prisma.message.findMany({
      where: { userId },
    });
  }

  remove(messageId: string, userId: string) {
    return this.prisma.message.deleteMany({
      where: {
        userId: userId,
        messageId: messageId,
      },
    });
  }
}
