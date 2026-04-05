import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { MessageDTO } from './messages.image/messages.create.dto';

@Injectable()
export class MessagesService {
  private prisma = new PrismaClient();

  create(messageImage: MessageDTO) {
    return this.prisma.message.create({
      data: {
        roomId: messageImage.roomId,
        userId: messageImage.userId,
        content: messageImage.content,
      },
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

  findMessagesByRoom(roomId: string) {
    return this.prisma.message.findMany({
      where: { roomId },
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
