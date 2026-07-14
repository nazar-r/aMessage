import { Injectable } from '@nestjs/common';
import { PrismaService } from '../src.b.prisma/prisma.service';
import { MessageDTO } from './messages.image/messages.create.dto';

@Injectable()
export class MessagesService {
  constructor(
    private readonly prisma: PrismaService,
  ) { }

  createMessage(message: MessageDTO) {
    return this.prisma.message.create({
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
    return this.prisma.message.update({
      where: {
        messageId: message.messageId,
      },
      data: {
        content: message.content,
      },
    });
  }

  findMessagesByRoom(roomId: string, options?: { take?: number; cursor?: string }) {
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
  
  removeMessage(messageId: string, userId: string) {
    return this.prisma.message.deleteMany({
      where: {
        userId,
        messageId,
      },
    });
  }

  findMessages(userId: string) {
    return this.prisma.message.findMany({
      where: { userId },
    });
  }
}