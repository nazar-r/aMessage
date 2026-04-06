import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { MessageDTO } from './messages.image/messages.create.dto';

@Injectable()
export class MessagesService {
  private prisma = new PrismaClient();

  async create(messageImage: MessageDTO) {
  return this.prisma.$transaction(async (tx) => {
    await tx.room.upsert({
      where: { roomId: messageImage.roomId },
      update: {},
      create: { roomId: messageImage.roomId },
      select: { roomId: true },
    });

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
      select: { roomId: true },
    });

    return tx.message.create({
      data: {
        roomId: messageImage.roomId,
        userId: messageImage.userId,
        content: messageImage.content,
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

  update(message: { messageId: string; content: string }) {
    return this.prisma.message.update({
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
