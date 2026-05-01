import { MessageDTO } from './messages.image/messages.create.dto';
export declare class MessagesService {
    private prisma;
    create(messageImage: MessageDTO): Promise<{
        roomId: string;
        messageId: string;
        userId: string;
        content: string;
        createdAt: Date;
    }>;
    update(message: {
        messageId: string;
        content: string;
    }): import("@prisma/client").Prisma.Prisma__MessageClient<{
        roomId: string;
        messageId: string;
        userId: string;
        content: string;
        createdAt: Date;
        updatedAt: Date;
    }, never, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    findMessagesByRoom(roomId: string, options?: {
        take?: number;
        cursor?: string;
    }): import("@prisma/client").Prisma.PrismaPromise<{
        messageId: string;
        userId: string;
        content: string;
        createdAt: Date;
    }[]>;
    findMessages(userId: string): import("@prisma/client").Prisma.PrismaPromise<{
        roomId: string;
        messageId: string;
        userId: string;
        content: string;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    remove(messageId: string, userId: string): import("@prisma/client").Prisma.PrismaPromise<import("@prisma/client").Prisma.BatchPayload>;
}
