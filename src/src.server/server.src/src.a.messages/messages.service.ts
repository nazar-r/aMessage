import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CreateMessageDto } from './messages.image/messages.create.dto';

@Injectable()
export class MessagesService {
  private prisma = new PrismaClient();

  create(createMessageDto: CreateMessageDto, cookiesUserId: string) {
    // return this.prisma.message.create({
    //   data: {
    //     content: createMessageDto.content,
    //     user: {
    //       connect: { userId: cookiesUserId },
    //     },
    //   },
    // });
  }

  findMessages(userId: string,) {
    return this.prisma.message.findMany({
      where: { userId },
    });
  }

  update(messageId: string, userId: string, content: string) {
    return this.prisma.message.updateMany({
      where: {
        userId: userId,
        messageId: messageId,
      },

      data: {
        content: content,
      },
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
