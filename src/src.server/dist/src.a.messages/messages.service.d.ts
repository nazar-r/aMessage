import { PrismaService } from '../src.b.prisma/prisma.service';
import { MessageDTO } from './messages.image/messages.create.dto';
export declare class MessagesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    createMessage(message: MessageDTO): import("@prisma/client").Prisma.Prisma__MessageClient<{
        userId: string;
        createdAt: Date;
        messageId: string;
        content: string;
        roomId: string;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    updateMessage(message: {
        messageId: string;
        content: string;
    }): import("@prisma/client").Prisma.Prisma__MessageClient<{
        userId: string;
        createdAt: Date;
        messageId: string;
        content: string;
        updatedAt: Date;
        roomId: string;
    }, never, import("@prisma/client/runtime/library").DefaultArgs>;
    findMessagesByRoom(roomId: string, options?: {
        take?: number;
        cursor?: string;
    }): import("@prisma/client").Prisma.PrismaPromise<{
        userId: string;
        createdAt: Date;
        messageId: string;
        content: string;
    }[]>;
    removeMessage(messageId: string, userId: string): import("@prisma/client").Prisma.PrismaPromise<import("@prisma/client").Prisma.BatchPayload>;
    findMessages(userId: string): import("@prisma/client").Prisma.PrismaPromise<{
        userId: string;
        createdAt: Date;
        messageId: string;
        content: string;
        updatedAt: Date;
        roomId: string;
    }[]>;
}
